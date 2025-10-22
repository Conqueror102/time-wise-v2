import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getDatabase } from "@/lib/mongodb"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, organizationId, successUrl, cancelUrl } = await request.json()

    if (!priceId || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const organization = await db.collection("organizations").findOne({ _id: organizationId })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Create or retrieve Stripe customer
    let customerId = organization.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: organization.adminEmail,
        metadata: {
          organizationId: organizationId,
        },
      })
      customerId = customer.id

      // Update organization with customer ID
      await db
        .collection("organizations")
        .updateOne({ _id: organizationId }, { $set: { stripeCustomerId: customerId } })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        organizationId: organizationId,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
