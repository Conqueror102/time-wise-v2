import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Parse request body for hard delete option
    const body = await request.json().catch(() => ({}))
    const hardDelete = body.hardDelete || false

    // Delete organization
    const orgService = new OrganizationService()
    await orgService.deleteOrganization(
      params.id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request),
      hardDelete
    )

    return NextResponse.json({
      success: true,
      message: hardDelete
        ? "Organization permanently deleted"
        : "Organization marked as cancelled",
    })
  } catch (error: any) {
    console.error("Delete organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: error.statusCode || 500 }
    )
  }
}
