/**
 * Authenticate with Fingerprint API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff } from "@/lib/types"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import type { VerifyAuthenticationResponseOpts } from "@simplewebauthn/server"

export async function POST(request: NextRequest) {
  try {
    const { 
      credentialId, 
      tenantId,
      challenge,
      authenticatorData,
      clientDataJSON,
      signature
    } = await request.json()

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
    let credential: any = null
    
    if (tenantId) {
      // Search within specific tenant
      const tenantDb = createTenantDatabase(db, tenantId)
      staff = await tenantDb.findOne<Staff>("staff", {
        "biometricCredentials.credentialId": credentialId,
      })
      
      if (staff) {
        credential = staff.biometricCredentials?.find(
          (c: any) => c.credentialId === credentialId
        )
      }
    } else {
      // Search across all organizations
      staff = await db.collection("staff").findOne({
        "biometricCredentials.credentialId": credentialId,
      })
      
      if (staff) {
        finalTenantId = staff.tenantId
        credential = staff.biometricCredentials?.find(
          (c: any) => c.credentialId === credentialId
        )
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

    // Verify the authentication signature using SimpleWebAuthn
    if (credential && challenge && authenticatorData && clientDataJSON && signature) {
      try {
        const credentialCounter = credential.counter || 0
        
        const verificationOpts: VerifyAuthenticationResponseOpts = {
          response: {
            id: credentialId,
            rawId: credentialId,
            type: "public-key",
            response: {
              authenticatorData,
              clientDataJSON,
              signature,
              userHandle: null,
            },
          },
          expectedChallenge: challenge,
          expectedOrigin: new URL(request.url).origin,
          expectedRPID: new URL(request.url).hostname,
          authenticator: {
            credentialID: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            credentialPublicKey: credential.publicKeyPEM 
              ? new Uint8Array(Buffer.from(credential.publicKeyPEM, 'base64'))
              : Uint8Array.from(atob(credential.publicKey), c => c.charCodeAt(0)),
            counter: credentialCounter,
          },
          requireUserVerification: true,
        }

        const verification = await verifyAuthenticationResponse(verificationOpts)
        
        if (!verification.verified) {
          return NextResponse.json(
            { error: "Authentication verification failed" },
            { status: 401 }
          )
        }

        // Update the counter to prevent replay attacks
        const newCounter = verification.authenticationInfo.newCounter
        if (newCounter !== undefined) {
          credential.counter = newCounter
        }
      } catch (error) {
        console.error("WebAuthn verification error:", error)
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: 401 }
        )
      }
    }

    // Update last used timestamp and counter for this credential
    const tenantDb = createTenantDatabase(db, finalTenantId)
    const updateData: any = {
      "biometricCredentials.$.lastUsed": new Date(),
    }
    
    if (credential?.counter !== undefined) {
      updateData["biometricCredentials.$.counter"] = credential.counter
    }
    
    await tenantDb.updateOne<Staff>(
      "staff",
      { 
        staffId: staff.staffId,
        "biometricCredentials.credentialId": credentialId,
      },
      {
        $set: updateData,
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
