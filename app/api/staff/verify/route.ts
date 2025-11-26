/**
 * Verify Staff API - Public endpoint for biometric registration
 * Requires tenantId to ensure staff belongs to the correct organization
 */

import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const tenantId = searchParams.get("tenantId")

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Organization context is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Verify organization exists
    const organization = await db.collection("organizations").findOne({
      _id: new ObjectId(tenantId),
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Find staff member in this specific organization
    const tenantDb = createTenantDatabase(db, tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", {
      staffId: staffId.toUpperCase(),
      isActive: true,
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found in this organization or inactive" },
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
