import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AuditService } from "@/lib/services/audit"
import { AuditAction } from "@/lib/types/super-admin"
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
    const action = searchParams.get("action") as AuditAction | ""
    const tenantId = searchParams.get("tenantId") || ""
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined

    // Get audit logs
    const auditService = new AuditService()
    const result = await auditService.getLogs({
      page,
      perPage,
      search,
      action: action || undefined,
      tenantId: tenantId || undefined,
      dateFrom,
      dateTo,
    })

    // Log this action (viewing logs)
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_LOGS",
      metadata: { page, search, action, tenantId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Get audit logs error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
