import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getDatabase } from "@/lib/mongodb"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const db = await getDatabase()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId

        if (organizationId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0].price.id

          // Find the plan based on price ID
          const plan = SUBSCRIPTION_PLANS.find((p) => p.stripePriceId === priceId)

          if (plan) {
            await db.collection("organizations").updateOne(
              { _id: organizationId },
              {
                $set: {
                  subscriptionTier: plan.id,
                  subscriptionStatus: "active",
                  stripeSubscriptionId: subscription.id,
                  allowedMethods: plan.allowedMethods,
                  "settings.maxStaff": plan.maxStaff,
                },
              },
            )
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)

        if (customer && !customer.deleted) {
          const organizationId = customer.metadata?.organizationId

          if (organizationId) {
            const priceId = subscription.items.data[0].price.id
            const plan = SUBSCRIPTION_PLANS.find((p) => p.stripePriceId === priceId)

            if (plan) {
              await db.collection("organizations").updateOne(
                { _id: organizationId },
                {
                  $set: {
                    subscriptionTier: plan.id,
                    subscriptionStatus: subscription.status === "active" ? "active" : "inactive",
                    allowedMethods: plan.allowedMethods,
                    "settings.maxStaff": plan.maxStaff,
                  },
                },
              )
            }
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)

        if (customer && !customer.deleted) {
          const organizationId = customer.metadata?.organizationId

          if (organizationId) {
            // Downgrade to free plan
            const freePlan = SUBSCRIPTION_PLANS.find((p) => p.id === "free")!

            await db.collection("organizations").updateOne(
              { _id: organizationId },
              {
                $set: {
                  subscriptionTier: "free",
                  subscriptionStatus: "cancelled",
                  allowedMethods: freePlan.allowedMethods,
                  "settings.maxStaff": freePlan.maxStaff,
                },
                $unset: {
                  stripeSubscriptionId: "",
                },
              },
            )
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
