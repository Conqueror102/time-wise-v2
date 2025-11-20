/**
 * Get Fingerprint Credentials for Staff Member
 * Returns credential IDs for a specific staff member
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tenantId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find staff member
    let staff: any = null
    
    if (tenantId) {
      // Search within specific tenant
      const tenantDb = createTenantDatabase(db, tenantId)
      staff = await tenantDb.findOne<Staff>("staff", { staffId })
    } else {
      // Search across all organizations
      staff = await db.collection("staff").findOne({ staffId })
    }

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      )
    }

    if (!staff.isActive) {
      return NextResponse.json(
        { error: "Staff member is inactive" },
        { status: 403 }
      )
    }

    // Return credential IDs (not the full credentials with public keys)
    const credentials = (staff.biometricCredentials || []).map((cred: any) => ({
      credentialId: cred.credentialId,
      deviceName: cred.deviceName,
      registeredAt: cred.registeredAt,
    }))

    // Return empty array if no credentials (don't return 404)
    return NextResponse.json({
      success: true,
      credentials,
      hasFingerprint: credentials.length > 0,
    })
  } catch (error) {
    console.error("Get credentials error:", error)
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    )
  }
}
