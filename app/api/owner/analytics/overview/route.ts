import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AnalyticsService } from "@/lib/services/analytics"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get dashboard stats
    const analyticsService = new AnalyticsService()
    const stats = await analyticsService.getDashboardStats()

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_ANALYTICS",
      metadata: { type: "dashboard_overview" },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Dashboard overview error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard stats" },
      { status: error.statusCode || 500 }
    )
  }
}
