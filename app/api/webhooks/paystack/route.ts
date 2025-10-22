/**
 * Paystack Webhook Handler
 * Handles webhook events from Paystack for subscription management
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { updateSubscriptionAfterPayment, cancelSubscription } from "@/lib/subscription/subscription-manager"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      console.error("No signature provided")
      return NextResponse.json({ error: "No signature" }, { status: 401 })
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      console.error("Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse event
    const event = JSON.parse(body)
    console.log("Paystack webhook event:", event.event)

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data)
        break

      case "subscription.create":
        await handleSubscriptionCreate(event.data)
        break

      case "subscription.disable":
        await handleSubscriptionDisable(event.data)
        break

      case "subscription.not_renew":
        await handleSubscriptionNotRenew(event.data)
        break

      default:
        console.log("Unhandled event type:", event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * Handle successful charge
 */
async function handleChargeSuccess(data: any) {
  try {
    const metadata = data.metadata

    if (!metadata || !metadata.organizationId || !metadata.plan) {
      console.log("Missing metadata in charge.success")
      return
    }

    // Calculate next payment date
    const nextPaymentDate = new Date()
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30)

    // Update subscription
    await updateSubscriptionAfterPayment(
      metadata.organizationId,
      metadata.plan,
      {
        subscriptionCode: data.reference,
        customerCode: data.customer.customer_code,
        amount: data.amount / 100, // Convert from kobo to naira
        nextPaymentDate,
      }
    )

    console.log("Subscription updated after charge.success:", metadata.organizationId)
  } catch (error) {
    console.error("Error handling charge.success:", error)
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreate(data: any) {
  try {
    console.log("Subscription created:", data.subscription_code)
    // Additional logic if needed
  } catch (error) {
    console.error("Error handling subscription.create:", error)
  }
}

/**
 * Handle subscription disable
 */
async function handleSubscriptionDisable(data: any) {
  try {
    const metadata = data.metadata

    if (!metadata || !metadata.organizationId) {
      console.log("Missing metadata in subscription.disable")
      return
    }

    // Cancel subscription in database
    await cancelSubscription(metadata.organizationId)

    console.log("Subscription cancelled:", metadata.organizationId)
  } catch (error) {
    console.error("Error handling subscription.disable:", error)
  }
}

/**
 * Handle subscription not renewing
 */
async function handleSubscriptionNotRenew(data: any) {
  try {
    const metadata = data.metadata

    if (!metadata || !metadata.organizationId) {
      console.log("Missing metadata in subscription.not_renew")
      return
    }

    // Mark subscription as expiring
    console.log("Subscription not renewing:", metadata.organizationId)
    // Additional logic to notify user
  } catch (error) {
    console.error("Error handling subscription.not_renew:", error)
  }
}
