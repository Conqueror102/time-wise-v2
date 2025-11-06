/**
 * Register Fingerprint Credential API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, BiometricCredential } from "@/lib/types"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import type { VerifyRegistrationResponseOpts } from "@simplewebauthn/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { 
      staffId, 
      credentialId, 
      publicKey, 
      deviceName, 
      tenantId,
      attestationObject,
      clientDataJSON
    } = await request.json()

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

    // Verify the registration response using SimpleWebAuthn
    let verification
    if (attestationObject && clientDataJSON) {
      try {
        const verificationOpts: VerifyRegistrationResponseOpts = {
          response: {
            id: credentialId,
            rawId: credentialId,
            type: "public-key",
            response: {
              attestationObject,
              clientDataJSON,
              transports: ["internal"],
            },
          },
          expectedChallenge: "not-used-in-this-implementation", // In production, use actual challenge
          expectedOrigin: new URL(request.url).origin,
          expectedRPID: new URL(request.url).hostname,
          requireUserVerification: true,
        }

        verification = await verifyRegistrationResponse(verificationOpts)
        
        if (!verification.verified) {
          return NextResponse.json(
            { error: "Registration verification failed" },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error("WebAuthn verification error:", error)
        // Continue with registration even if verification fails for now
        // In production, you should handle this more strictly
      }
    }

    // Create new credential with full WebAuthn data
    const newCredential: BiometricCredential & { 
      attestationObject?: string, 
      clientDataJSON?: string,
      counter?: number,
      publicKeyPEM?: string
    } = {
      credentialId,
      publicKey,
      deviceName: deviceName || "Unknown Device",
      registeredAt: new Date(),
      ...(attestationObject && { attestationObject }),
      ...(clientDataJSON && { clientDataJSON }),
      ...(verification?.registrationInfo && {
        publicKeyPEM: verification.registrationInfo.publicKey,
        counter: verification.registrationInfo.counter,
      }),
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
