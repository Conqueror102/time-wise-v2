import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { UserManagementService } from "@/lib/services/user-management"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "50")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const tenantId = searchParams.get("tenantId") || ""
    const isActive = searchParams.get("isActive")
      ? searchParams.get("isActive") === "true"
      : undefined

    // Get users
    const userService = new UserManagementService()
    const result = await userService.getAllUsers({
      page,
      perPage,
      search,
      role,
      tenantId,
      isActive,
    })

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_USERS",
      metadata: { page, search, role, tenantId, isActive },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: error.statusCode || 500 }
    )
  }
}
