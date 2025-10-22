/**
 * Payment Initialize API
 * Initializes Paystack payment for subscription upgrade
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth"
import { initializePayment } from "@/lib/services/paystack"
import { PLAN_PRICES } from "@/lib/features/feature-manager"
import { getSubscription } from "@/lib/subscription/subscription-manager"
import { TenantError } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin"],
    })

    const { plan } = await request.json()

    // Validate plan
    if (!plan || !["professional", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { success: false, error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    // Check current subscription
    const subscription = await getSubscription(context.tenantId)

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "No subscription found" },
        { status: 404 }
      )
    }

    // Don't allow downgrade through this endpoint
    if (subscription.plan === "enterprise" && plan === "professional") {
      return NextResponse.json(
        { success: false, error: "Please contact support to downgrade" },
        { status: 400 }
      )
    }

    // Get plan price
    const planPrice = PLAN_PRICES[plan as "professional" | "enterprise"]

    if (!planPrice) {
      return NextResponse.json(
        { success: false, error: "Plan pricing not found" },
        { status: 400 }
      )
    }

    // Initialize payment with Paystack
    const result = await initializePayment(
      context.email,
      planPrice.monthly * 100, // Convert to kobo
      {
        organizationId: context.tenantId,
        plan,
        userId: context.userId,
        currentPlan: subscription.plan,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to initialize payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error) {
    console.error("Payment initialize error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 }
    )
  }
}
