import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AnalyticsService } from "@/lib/services/analytics"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get organization growth data
    const analyticsService = new AnalyticsService()
    const data = await analyticsService.getOrganizationGrowth()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Organization growth analytics error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch growth data" },
      { status: error.statusCode || 500 }
    )
  }
}
