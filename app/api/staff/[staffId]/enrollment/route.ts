/**
 * Create a biometric registration link for a staff member (org admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, TenantError } from "@/lib/types"
import { signEnrollmentToken } from "@/lib/auth/checkin-tokens"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const context = await withAuth(request, { allowedRoles: ["org_admin", "manager"] })
    const { staffId } = await params

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", { staffId })

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: "Staff not found or inactive" }, { status: 404 })
    }

    const token = signEnrollmentToken(context.tenantId, staff.staffId)

    return NextResponse.json({
      success: true,
      path: `/register-biometric?token=${encodeURIComponent(token)}`,
      expiresInHours: 24,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("Create enrollment link error:", error)
    return NextResponse.json({ error: "Failed to create registration link" }, { status: 500 })
  }
}
