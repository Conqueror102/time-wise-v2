import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get organization details
    const orgService = new OrganizationService()
    const details = await orgService.getOrganizationDetails(params.id)

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_ORGANIZATIONS",
      tenantId: params.id,
      metadata: { action: "view_details" },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(details)
  } catch (error: any) {
    console.error("Get organization details error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch organization details" },
      { status: error.statusCode || 500 }
    )
  }
}
