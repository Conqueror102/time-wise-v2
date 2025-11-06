/**
 * Get Single Staff Member API - Multi-tenant aware
 */

import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, TenantError } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const context = await withAuth(request)

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Find staff within tenant
    const staff = await tenantDb.findOne<Staff>("staff", { staffId: params.staffId })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      staff,
    })
  } catch (error) {
    console.error("Get staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

/**
 * UPDATE staff member
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const body = await request.json()
    const { name, email, department, position, isActive } = body

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Build update object
    const updateData: any = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (department !== undefined) updateData.department = department
    if (position !== undefined) updateData.position = position
    if (isActive !== undefined) updateData.isActive = isActive

    // Update staff
    const updated = await tenantDb.updateOne<Staff>(
      "staff",
      { staffId: params.staffId },
      { $set: updateData }
    )

    if (!updated) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Fetch updated staff
    const staff = await tenantDb.findOne<Staff>("staff", { staffId: params.staffId })

    return NextResponse.json({
      success: true,
      message: "Staff updated successfully",
      staff,
    })
  } catch (error) {
    console.error("Update staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    )
  }
}

/**
 * DELETE staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Delete staff
    const deleted = await tenantDb.deleteOne<Staff>("staff", { staffId: params.staffId })

    if (!deleted) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Staff deleted successfully",
    })
  } catch (error) {
    console.error("Delete staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    )
  }
}
