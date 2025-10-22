import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AnalyticsService } from "@/lib/services/analytics"
import { TimePeriod } from "@/lib/types/super-admin"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") || "month") as TimePeriod

    // Get revenue growth data
    const analyticsService = new AnalyticsService()
    const data = await analyticsService.getRevenueGrowth(period)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Revenue analytics error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch revenue data" },
      { status: error.statusCode || 500 }
    )
  }
}
