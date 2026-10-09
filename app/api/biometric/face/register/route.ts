/**
 * Register Face Data API
 * Requires an enrollment token issued by an org admin for this staff member.
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, FaceData, TenantError } from "@/lib/types"
import { verifyEnrollmentToken } from "@/lib/auth/checkin-tokens"
import { deleteFace, registerFace } from "@/lib/services/face-recognition"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { enrollToken, faceImage } = await request.json()
    const { tenantId, staffId } = verifyEnrollmentToken(enrollToken)

    if (!faceImage || typeof faceImage !== "string") {
      return NextResponse.json({ error: "Face image is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", { staffId })

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: "Staff not found or inactive" }, { status: 404 })
    }

    const faceResult = await registerFace(faceImage, tenantId, staffId)

    if (!faceResult.success || !faceResult.faceId) {
      return NextResponse.json(
        { error: faceResult.error || "Failed to register face" },
        { status: 400 }
      )
    }

    // Remove the previous face so it can no longer match. CompreFace already
    // replaced it during registration; Rekognition keeps old faces until deleted.
    const replacedInPlace = staff.faceData?.provider === "compreface" && faceResult.provider === "compreface"
    if (staff.faceData && !replacedInPlace) {
      await deleteFace(staff.faceData, tenantId, staffId)
    }

    // The image itself lives in the recognition service; only keep the reference
    const faceData: FaceData = {
      faceId: faceResult.faceId,
      provider: faceResult.provider,
      registeredAt: new Date(),
    }

    await tenantDb.updateOne<Staff>(
      "staff",
      { staffId },
      { $set: { faceData, updatedAt: new Date() } }
    )

    return NextResponse.json({
      success: true,
      message: "Face registered successfully",
      faceId: faceData.faceId,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("Register face error:", error)
    return NextResponse.json({ error: "Failed to register face" }, { status: 500 })
  }
}
