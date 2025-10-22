/**
 * Register Fingerprint Credential API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, BiometricCredential } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { staffId, credentialId, publicKey, deviceName, tenantId } = await request.json()

    if (!staffId || !credentialId || !publicKey) {
      return NextResponse.json(
        { error: "Staff ID, credential ID, and public key are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find staff member
    let finalTenantId = tenantId
    let staff: any = null
    
    if (!finalTenantId) {
      // Search for staff member across organizations
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

    // Create new credential
    const newCredential: BiometricCredential = {
      credentialId,
      publicKey,
      deviceName: deviceName || "Unknown Device",
      registeredAt: new Date(),
    }

    // Add credential to staff record
    const tenantDb = createTenantDatabase(db, finalTenantId)
    await tenantDb.updateOne<Staff>(
      "staff",
      { staffId },
      {
        $push: { biometricCredentials: newCredential } as any,
        $set: { updatedAt: new Date() },
      }
    )

    return NextResponse.json({
      success: true,
      message: "Fingerprint registered successfully",
      credentialId,
    })
  } catch (error) {
    console.error("Register fingerprint error:", error)
    return NextResponse.json(
      { error: "Failed to register fingerprint" },
      { status: 500 }
    )
  }
}
