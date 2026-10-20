/**
 * Authenticate with Face Recognition API (kiosk)
 * Requires the kiosk token; only faces registered to that tenant can match.
 *
 * With liveness on (the default), a recognised face doesn't get a check-in proof
 * straight away: it gets a head-turn challenge, completed through
 * /api/biometric/face/liveness. Pass `expectedStaffId` when confirming the person
 * behind a QR code or Staff ID.
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, TenantError } from "@/lib/types"
import { signBiometricProof, verifyKioskRequest } from "@/lib/auth/checkin-tokens"
import { searchFace } from "@/lib/services/face-recognition"
import { getCheckInPolicy } from "@/lib/checkin/policy"
import { isFacingCamera, startChallenge } from "@/lib/checkin/liveness"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = verifyKioskRequest(request)
    const { faceImage, expectedStaffId } = await request.json()

    if (!faceImage || typeof faceImage !== "string") {
      return NextResponse.json({ error: "Face image is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const organization = await db.collection("organizations").findOne({ _id: new ObjectId(tenantId) })
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    const { faceLiveness } = getCheckInPolicy(organization)

    const faceResult = await searchFace(faceImage, tenantId, { landmarks: faceLiveness })

    if (!faceResult.success || !faceResult.staffId) {
      // NO_FACE: nobody in view; NOT_RECOGNIZED: a face that isn't enrolled here;
      // SERVICE_ERROR: the recognition service failed
      const code = faceResult.noFace ? "NO_FACE" : faceResult.faceWidthRatio !== undefined ? "NOT_RECOGNIZED" : "SERVICE_ERROR"
      return NextResponse.json(
        { error: faceResult.error || "Face not recognized", code, faceWidthRatio: faceResult.faceWidthRatio },
        { status: code === "SERVICE_ERROR" ? 503 : code === "NO_FACE" ? 422 : 404 }
      )
    }

    if (typeof expectedStaffId === "string" && faceResult.staffId !== expectedStaffId.trim().toUpperCase()) {
      return NextResponse.json(
        { error: "This face doesn't match that staff member", code: "WRONG_PERSON", faceWidthRatio: faceResult.faceWidthRatio },
        { status: 401 }
      )
    }

    const tenantDb = createTenantDatabase(db, tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", {
      staffId: faceResult.staffId,
      isActive: true,
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    await tenantDb.updateOne<Staff>(
      "staff",
      { staffId: staff.staffId },
      { $set: { "faceData.lastUsed": new Date() } as any }
    )

    const recognised = {
      success: true,
      staffId: staff.staffId,
      staffName: staff.name,
      department: staff.department,
      faceWidthRatio: faceResult.faceWidthRatio,
    }

    if (!faceLiveness) {
      return NextResponse.json({ ...recognised, biometricProof: signBiometricProof(tenantId, staff.staffId, "face") })
    }

    // The challenge starts from a straight-on frame, so every turn is measured from it
    if (!isFacingCamera(faceResult.turn)) {
      return NextResponse.json({ ...recognised, liveness: { status: "face-camera", hint: "Look straight at the camera" } })
    }
    const challenge = startChallenge(tenantId, staff.staffId, faceResult.turn)
    return NextResponse.json({ ...recognised, liveness: { status: "challenge", token: challenge.token, steps: challenge.steps } })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("Authenticate face error:", error)
    return NextResponse.json({ error: "Failed to authenticate face" }, { status: 500 })
  }
}
