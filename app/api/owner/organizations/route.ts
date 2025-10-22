import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "50")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const subscriptionTier = searchParams.get("subscriptionTier") || ""

    // Get organizations
    const orgService = new OrganizationService()
    const result = await orgService.getAllOrganizations({
      page,
      perPage,
      search,
      status,
      subscriptionTier,
    })

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_ORGANIZATIONS",
      metadata: { page, search, status, subscriptionTier },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Get organizations error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch organizations" },
      { status: error.statusCode || 500 }
    )
  }
}
