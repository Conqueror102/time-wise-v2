/**
 * Subscription Management System
 * Handles subscription lifecycle and Paystack integration
 */

import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export interface Subscription {
  _id?: ObjectId
  organizationId: string
  plan: "free_trial" | "starter" | "professional" | "enterprise"
  status: "active" | "cancelled" | "expired" | "past_due"
  trialEndDate: Date | null
  subscriptionStartDate: Date
  subscriptionEndDate: Date | null
  paystackSubscriptionCode: string | null
  paystackCustomerCode: string | null
  lastPaymentDate: Date | null
  nextPaymentDate: Date | null
  amount: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Create initial free trial subscription
 */
export async function createTrialSubscription(organizationId: string): Promise<Subscription> {
  const db = await getDatabase()
  const now = new Date()
  const trialEndDate = new Date(now)
  trialEndDate.setDate(trialEndDate.getDate() + 14)

  const subscription: Subscription = {
    organizationId,
    plan: "free_trial",
    status: "active",
    trialEndDate,
    subscriptionStartDate: now,
    subscriptionEndDate: null,
    paystackSubscriptionCode: null,
    paystackCustomerCode: null,
    lastPaymentDate: null,
    nextPaymentDate: null,
    amount: 0,
    currency: "NGN",
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection("subscriptions").insertOne(subscription)
  subscription._id = result.insertedId

  return subscription
}

/**
 * Get organization subscription
 */
export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  const db = await getDatabase()
  const subscription = await db.collection("subscriptions").findOne({
    organizationId,
  })

  return subscription as Subscription | null
}

/**
 * Update subscription after successful payment
 */
export async function updateSubscriptionAfterPayment(
  organizationId: string,
  plan: "professional" | "enterprise",
  paystackData: {
    subscriptionCode: string
    customerCode: string
    amount: number
    nextPaymentDate: Date
  }
): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  await db.collection("subscriptions").updateOne(
    { organizationId },
    {
      $set: {
        plan,
        status: "active",
        paystackSubscriptionCode: paystackData.subscriptionCode,
        paystackCustomerCode: paystackData.customerCode,
        lastPaymentDate: now,
        nextPaymentDate: paystackData.nextPaymentDate,
        amount: paystackData.amount,
        trialEndDate: null, // Clear trial
        updatedAt: now,
      },
    }
  )
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(organizationId: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  await db.collection("subscriptions").updateOne(
    { organizationId },
    {
      $set: {
        status: "cancelled",
        subscriptionEndDate: now,
        updatedAt: now,
      },
    }
  )
}

/**
 * Check and update expired subscriptions
 */
export async function checkExpiredSubscriptions(): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  // Expire trials
  await db.collection("subscriptions").updateMany(
    {
      plan: "free_trial",
      status: "active",
      trialEndDate: { $lt: now },
    },
    {
      $set: {
        status: "expired",
        updatedAt: now,
      },
    }
  )

  // Expire paid subscriptions past due
  await db.collection("subscriptions").updateMany(
    {
      plan: { $in: ["professional", "enterprise"] },
      status: "active",
      nextPaymentDate: { $lt: now },
    },
    {
      $set: {
        status: "past_due",
        updatedAt: now,
      },
    }
  )
}

/**
 * Downgrade to starter after trial expiry
 */
export async function downgradeToStarter(organizationId: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  await db.collection("subscriptions").updateOne(
    { organizationId },
    {
      $set: {
        plan: "starter",
        status: "active",
        trialEndDate: null,
        updatedAt: now,
      },
    }
  )
}

/**
 * Get subscription status for organization
 */
export async function getSubscriptionStatus(organizationId: string): Promise<{
  plan: string
  status: string
  isActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
  features: any
}> {
  const subscription = await getSubscription(organizationId)

  if (!subscription) {
    return {
      plan: "none",
      status: "inactive",
      isActive: false,
      needsUpgrade: true,
      trialDaysRemaining: null,
      features: {},
    }
  }

  const isActive = subscription.status === "active"
  let trialDaysRemaining: number | null = null

  if (subscription.plan === "free_trial" && subscription.trialEndDate) {
    const diff = subscription.trialEndDate.getTime() - new Date().getTime()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const needsUpgrade =
    subscription.plan === "free_trial" &&
    subscription.trialEndDate &&
    new Date() > subscription.trialEndDate

  return {
    plan: subscription.plan,
    status: subscription.status,
    isActive,
    needsUpgrade,
    trialDaysRemaining,
    features: subscription,
  }
}
