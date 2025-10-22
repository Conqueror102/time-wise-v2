/**
 * Authenticate with Fingerprint API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { credentialId, tenantId } = await request.json()

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find staff member with this credential
    let staff: any = null
    let finalTenantId = tenantId
    
    if (tenantId) {
      // Search within specific tenant
      const tenantDb = createTenantDatabase(db, tenantId)
      staff = await tenantDb.findOne<Staff>("staff", {
        "biometricCredentials.credentialId": credentialId,
      })
    } else {
      // Search across all organizations
      staff = await db.collection("staff").findOne({
        "biometricCredentials.credentialId": credentialId,
      })
      
      if (staff) {
        finalTenantId = staff.tenantId
      }
    }

    if (!staff) {
      return NextResponse.json(
        { error: "Fingerprint not recognized" },
        { status: 404 }
      )
    }

    if (!staff.isActive) {
      return NextResponse.json(
        { error: "Staff member is inactive" },
        { status: 403 }
      )
    }

    // Update last used timestamp for this credential
    const tenantDb = createTenantDatabase(db, finalTenantId)
    await tenantDb.updateOne<Staff>(
      "staff",
      { 
        staffId: staff.staffId,
        "biometricCredentials.credentialId": credentialId,
      },
      {
        $set: { 
          "biometricCredentials.$.lastUsed": new Date(),
        } as any,
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
    console.error("Authenticate fingerprint error:", error)
    return NextResponse.json(
      { error: "Failed to authenticate fingerprint" },
      { status: 500 }
    )
  }
}
