import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AnalyticsService } from "@/lib/services/analytics"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get system analytics
    const analyticsService = new AnalyticsService()

    const [
      todayCheckins,
      todayLateArrivals,
      totalAttendanceLogs,
      staffRatio,
      photoVerificationRate,
      mostActiveTenants,
    ] = await Promise.all([
      analyticsService.getTodayCheckins(),
      analyticsService.getTodayLateArrivals(),
      analyticsService.getTotalAttendanceLogs(),
      analyticsService.getActiveVsInactiveStaff(),
      analyticsService.getPhotoVerificationRate(),
      analyticsService.getMostActiveTenants(10),
    ])

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_ANALYTICS",
      metadata: { type: "system_analytics" },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      todayCheckins,
      todayLateArrivals,
      totalAttendanceLogs,
      staffRatio,
      photoVerificationRate,
      mostActiveTenants,
    })
  } catch (error: any) {
    console.error("System analytics error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch system analytics" },
      { status: error.statusCode || 500 }
    )
  }
}
