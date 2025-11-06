/**
 * Manage Biometric Credentials API
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, TenantError } from "@/lib/types"

// Get staff biometric credentials
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    const staff = await tenantDb.findOne<Staff>("staff", { staffId })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      staffId: staff.staffId,
      staffName: staff.name,
      biometricCredentials: staff.biometricCredentials || [],
      faceData: staff.faceData ? {
        faceId: staff.faceData.faceId,
        registeredAt: staff.faceData.registeredAt,
        lastUsed: staff.faceData.lastUsed,
      } : null,
    })
  } catch (error) {
    console.error("Get credentials error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    )
  }
}

// Delete a biometric credential
export async function DELETE(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const { staffId, credentialId, deleteFace } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    if (deleteFace) {
      // Delete face data
      await tenantDb.updateOne<Staff>(
        "staff",
        { staffId },
        {
          $unset: { faceData: "" } as any,
          $set: { updatedAt: new Date() },
        }
      )
    } else if (credentialId) {
      // Delete specific fingerprint credential
      await tenantDb.updateOne<Staff>(
        "staff",
        { staffId },
        {
          $pull: { biometricCredentials: { credentialId } } as any,
          $set: { updatedAt: new Date() },
        }
      )
    } else {
      return NextResponse.json(
        { error: "Credential ID or deleteFace flag is required" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Credential deleted successfully",
    })
  } catch (error) {
    console.error("Delete credential error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    )
  }
}
