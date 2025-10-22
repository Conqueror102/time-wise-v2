import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AnalyticsService } from "@/lib/services/analytics"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get subscription distribution and payment success rate
    const analyticsService = new AnalyticsService()
    
    const [subscriptionDistribution, paymentSuccessRate] = await Promise.all([
      analyticsService.getSubscriptionDistribution(),
      analyticsService.getPaymentSuccessRate(),
    ])

    return NextResponse.json({
      subscriptionDistribution,
      paymentSuccessRate,
    })
  } catch (error: any) {
    console.error("Distribution analytics error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch distribution data" },
      { status: error.statusCode || 500 }
    )
  }
}
