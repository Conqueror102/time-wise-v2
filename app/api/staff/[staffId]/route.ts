/**
 * Get Single Staff Member API - Multi-tenant aware
 */

import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, TenantError } from "@/lib/types"
import { deleteFace } from "@/lib/services/face-recognition"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params
    const context = await withAuth(request)

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Find staff within tenant
    const staff = await tenantDb.findOne<Staff>("staff", { staffId: staffId })

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
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const body = await request.json()
    const { name, email, department, position, isActive } = body

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Build update object; required text fields may not be blanked
    const updateData: any = { updatedAt: new Date() }
    for (const [field, value] of Object.entries({ name, department, position })) {
      if (value === undefined) continue
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json({ error: `${field[0].toUpperCase()}${field.slice(1)} is required` }, { status: 400 })
      }
      updateData[field] = value.trim()
    }
    if (email !== undefined) {
      const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
      if (normalizedEmail) {
        const existing = await tenantDb.findOne<Staff>("staff", { email: normalizedEmail, staffId: { $ne: staffId } })
        if (existing) {
          return NextResponse.json({ error: "Another staff member already uses this email" }, { status: 400 })
        }
      }
      updateData.email = normalizedEmail
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be true or false" }, { status: 400 })
      }
      updateData.isActive = isActive
    }

    // Update staff
    const updated = await tenantDb.updateOne<Staff>(
      "staff",
      { staffId: staffId },
      { $set: updateData }
    )

    if (!updated) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    // Fetch updated staff
    const staff = await tenantDb.findOne<Staff>("staff", { staffId: staffId })

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
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params
    const context = await withAuth(request, {
      allowedRoles: ["org_admin"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    const staff = await tenantDb.findOne<Staff>("staff", { staffId })
    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    await tenantDb.deleteOne<Staff>("staff", { staffId })

    // Remove their stored face so it can no longer be matched
    await deleteFace(staff.faceData, context.tenantId, staffId)

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
