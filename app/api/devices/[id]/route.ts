/**
 * Remove a fingerprint device (org admin)
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/auth"
import { TenantError } from "@/lib/types"
import { deleteDevice } from "@/lib/devices/service"

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await withAuth(request, { allowedRoles: ["org_admin"] })
    const db = await getDatabase()
    if (!(await deleteDevice(db, context.tenantId, id))) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof TenantError) return NextResponse.json({ error: error.message }, { status: error.statusCode })
    console.error("Delete device error:", error)
    return NextResponse.json({ error: "Failed to remove device" }, { status: 500 })
  }
}
