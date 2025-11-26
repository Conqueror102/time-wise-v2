/**
 * Payment Verify API
 * Verifies Paystack payment and upgrades subscription
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth"
import { getUTCDate, addDaysUTC } from "@/lib/utils/date"
import { verifyPayment } from "@/lib/services/paystack"
import { updateSubscriptionAfterPayment } from "@/lib/subscription/subscription-manager"
import { PLAN_PRICES } from "@/lib/features/feature-manager"
import { TenantError } from "@/lib/types"
import { applyRateLimit, RateLimitPresets } from "@/lib/middleware/rate-limit"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(request, RateLimitPresets.PAYMENT)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin"],
    })

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Payment reference is required" },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference)

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || "Payment verification failed" },
        { status: 400 }
      )
    }

    // Check payment status
    if (verification.status !== "success") {
      return NextResponse.json(
        { success: false, error: "Payment was not successful" },
        { status: 400 }
      )
    }

    // Verify amount matches expected plan price
    const plan = verification.metadata?.plan as "professional" | "enterprise"
    
    if (!plan || !["professional", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { success: false, error: "Invalid plan in payment metadata" },
        { status: 400 }
      )
    }

    const expectedAmount = PLAN_PRICES[plan].monthly * 100 // In kobo

    if (verification.amount !== expectedAmount) {
      console.error("Amount mismatch:", {
        expected: expectedAmount,
        received: verification.amount,
      })
      return NextResponse.json(
        { success: false, error: "Payment amount mismatch" },
        { status: 400 }
      )
    }

    // Verify organization ID matches
    if (verification.metadata?.organizationId !== context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Organization mismatch" },
        { status: 403 }
      )
    }

    // Calculate next payment date (30 days from now)
    const nextPaymentDate = addDaysUTC(getUTCDate(), 30)

    // Update subscription
    await updateSubscriptionAfterPayment(context.tenantId, plan, {
      subscriptionCode: reference,
      customerCode: verification.customer?.customer_code || "",
      amount: verification.amount! / 100, // Convert back to naira
      nextPaymentDate,
    })

    return NextResponse.json({
      success: true,
      message: "Subscription upgraded successfully",
      plan,
      nextPaymentDate,
    })
  } catch (error) {
    console.error("Payment verify error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
