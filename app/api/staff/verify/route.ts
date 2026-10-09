/**
 * Verify Staff API - resolves a biometric enrollment token to the staff member
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, TenantError } from "@/lib/types"
import { verifyEnrollmentToken } from "@/lib/auth/checkin-tokens"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get("token")
    const { tenantId, staffId } = verifyEnrollmentToken(token)

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", { staffId, isActive: true })

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
        hasFaceRegistered: !!staff.faceData,
      },
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: "This registration link is invalid or has expired. Ask your administrator for a new one." },
        { status: error.statusCode }
      )
    }
    console.error("Verify staff error:", error)
    return NextResponse.json({ error: "Failed to verify staff" }, { status: 500 })
  }
}
