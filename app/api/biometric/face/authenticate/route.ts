/**
 * Authenticate with Face Recognition API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { faceImage, faceEmbedding, tenantId } = await request.json()

    if (!faceImage && !faceEmbedding) {
      return NextResponse.json(
        { error: "Face data is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Search face using AWS Rekognition
    const { searchFace } = await import("@/lib/services/aws-rekognition")
    const rekognitionResult = await searchFace(faceImage || faceEmbedding!)

    if (!rekognitionResult.success || !rekognitionResult.staffId) {
      return NextResponse.json(
        { error: rekognitionResult.error || "Face not recognized" },
        { status: 404 }
      )
    }

    const matchedStaffId = rekognitionResult.staffId
    
    // Find staff member
    let staff: any = null
    let finalTenantId = tenantId
    
    if (tenantId) {
      const tenantDb = createTenantDatabase(db, tenantId)
      staff = await tenantDb.findOne<Staff>("staff", {
        staffId: matchedStaffId,
        isActive: true,
      })
    } else {
      staff = await db.collection("staff").findOne({
        staffId: matchedStaffId,
        isActive: true,
      })
      
      if (staff) {
        finalTenantId = staff.tenantId
      }
    }

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      )
    }

    // Update last used timestamp
    const tenantDb = createTenantDatabase(db, finalTenantId)
    await tenantDb.updateOne<Staff>(
      "staff",
      { staffId: staff.staffId },
      {
        $set: { 
          "faceData.lastUsed": new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      staffId: staff.staffId,
      staffName: staff.name,
      department: staff.department,
      tenantId: finalTenantId,
    })
  } catch (error) {
    console.error("Authenticate face error:", error)
    return NextResponse.json(
      { error: "Failed to authenticate face" },
      { status: 500 }
    )
  }
}
