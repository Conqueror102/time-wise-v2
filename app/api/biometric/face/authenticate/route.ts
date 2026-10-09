/**
 * Authenticate with Face Recognition API (kiosk)
 * Requires the kiosk token; only faces registered to that tenant can match.
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, TenantError } from "@/lib/types"
import { signBiometricProof, verifyKioskRequest } from "@/lib/auth/checkin-tokens"
import { searchFace } from "@/lib/services/face-recognition"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = verifyKioskRequest(request)
    const { faceImage } = await request.json()

    if (!faceImage || typeof faceImage !== "string") {
      return NextResponse.json({ error: "Face image is required" }, { status: 400 })
    }

    const faceResult = await searchFace(faceImage, tenantId)

    if (!faceResult.success || !faceResult.staffId) {
      // NO_FACE: nobody in view; NOT_RECOGNIZED: a face that isn't enrolled here;
      // SERVICE_ERROR: the recognition service failed
      const code = faceResult.noFace ? "NO_FACE" : faceResult.faceWidthRatio !== undefined ? "NOT_RECOGNIZED" : "SERVICE_ERROR"
      return NextResponse.json(
        { error: faceResult.error || "Face not recognized", code, faceWidthRatio: faceResult.faceWidthRatio },
        { status: code === "SERVICE_ERROR" ? 503 : code === "NO_FACE" ? 422 : 404 }
      )
    }

    const db = await getDatabase()
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

    return NextResponse.json({
      success: true,
      staffId: staff.staffId,
      staffName: staff.name,
      department: staff.department,
      faceWidthRatio: faceResult.faceWidthRatio,
      biometricProof: signBiometricProof(tenantId, staff.staffId, "face"),
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("Authenticate face error:", error)
    return NextResponse.json({ error: "Failed to authenticate face" }, { status: 500 })
  }
}
