/**
 * Verify Staff API - Public endpoint for biometric registration
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Staff } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find staff member across all organizations
    const staff = await db.collection("staff").findOne({
      staffId: staffId.toUpperCase(),
      isActive: true,
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found or inactive" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        department: staff.department,
        hasFingerprintRegistered: staff.biometricCredentials && staff.biometricCredentials.length > 0,
        hasFaceRegistered: !!staff.faceData,
      },
    })
  } catch (error) {
    console.error("Verify staff error:", error)
    return NextResponse.json(
      { error: "Failed to verify staff" },
      { status: 500 }
    )
  }
}
