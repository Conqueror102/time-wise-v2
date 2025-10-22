/**
 * Register Face Data API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, FaceData } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { staffId, faceImage, faceEmbedding, tenantId } = await request.json()

    if (!staffId || (!faceImage && !faceEmbedding)) {
      return NextResponse.json(
        { error: "Staff ID and face data are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find staff member
    let finalTenantId = tenantId
    let staff: any = null
    
    if (!finalTenantId) {
      const staffDoc = await db.collection("staff").findOne({ staffId })
      
      if (!staffDoc) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 })
      }
      
      finalTenantId = staffDoc.tenantId
      staff = staffDoc
    } else {
      const tenantDb = createTenantDatabase(db, finalTenantId)
      staff = await tenantDb.findOne<Staff>("staff", { staffId })
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Register face with AWS Rekognition
    const { registerFace } = await import("@/lib/services/aws-rekognition")
    const rekognitionResult = await registerFace(faceImage || faceEmbedding!, staffId)

    if (!rekognitionResult.success) {
      return NextResponse.json(
        { error: rekognitionResult.error || "Failed to register face" },
        { status: 400 }
      )
    }

    // Create face data
    const faceData: FaceData = {
      faceId: rekognitionResult.faceId || `face_${staffId}_${Date.now()}`,
      faceImage: faceImage || undefined,
      faceEmbedding: faceEmbedding || undefined,
      registeredAt: new Date(),
    }

    // Update staff record with face data
    const tenantDb = createTenantDatabase(db, finalTenantId)
    await tenantDb.updateOne<Staff>(
      "staff",
      { staffId },
      {
        $set: { 
          faceData,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: "Face registered successfully",
      faceId: faceData.faceId,
    })
  } catch (error) {
    console.error("Register face error:", error)
    return NextResponse.json(
      { error: "Failed to register face" },
      { status: 500 }
    )
  }
}
