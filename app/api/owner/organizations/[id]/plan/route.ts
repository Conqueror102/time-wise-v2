import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Parse request body
    const body = await request.json()
    const { plan } = body

    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      )
    }

    // Validate plan
    const validPlans = ["free", "basic", "pro", "enterprise"]
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be one of: free, basic, pro, enterprise" },
        { status: 400 }
      )
    }

    // Update subscription plan
    const orgService = new OrganizationService()
    await orgService.updateSubscriptionPlan(
      params.id,
      plan,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: `Subscription plan updated to ${plan}`,
    })
  } catch (error: any) {
    console.error("Update plan error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update subscription plan" },
      { status: error.statusCode || 500 }
    )
  }
}
