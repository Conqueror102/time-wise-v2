/**
 * Subscription Management System
 * Handles subscription lifecycle and Paystack integration
 */

import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUTCDate, addDaysUTC } from "@/lib/utils/date"

export interface Subscription {
  _id?: ObjectId
  organizationId: string
  plan: "starter" | "professional" | "enterprise"
  status: "active" | "cancelled" | "expired" | "past_due"
  trialEndDate: Date | null
  isTrialActive: boolean
  subscriptionStartDate: Date
  subscriptionEndDate: Date | null
  paystackSubscriptionCode: string | null
  paystackCustomerCode: string | null
  lastPaymentDate: Date | null
  nextPaymentDate: Date | null
  amount: number
  currency: string
  scheduledDowngrade?: {
    targetPlan: "starter" | "professional" | "enterprise"
    scheduledFor: Date
    requestedAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Create initial starter subscription with 14-day trial
 * All features unlocked during trial (except fingerprint)
 */
export async function createTrialSubscription(organizationId: string): Promise<Subscription> {
  const db = await getDatabase()
  const now = new Date()
  const trialEndDate = new Date(now)
  trialEndDate.setDate(trialEndDate.getDate() + 14)

  const subscription: Subscription = {
    organizationId,
    plan: "starter",
    status: "active",
    trialEndDate,
    isTrialActive: true,
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
  
  // Update organization record to reflect new plan and enable default features
  try {
    const orgUpdate: any = {
      subscriptionTier: plan,
      subscriptionStatus: "active",
      updatedAt: now,
    }

    // Default settings applied on upgrade
    if (plan === "professional") {
      // Professional: enable photo verification by default
      orgUpdate["settings.capturePhotos"] = true
      orgUpdate["settings.photoRetentionDays"] = 7
      // Ensure allowed methods include photo
      orgUpdate["allowedMethods"] = ["qr", "manual", "photo"]
    }

    if (plan === "enterprise") {
      // Enterprise: enable fingerprint and photo by default
      orgUpdate["settings.capturePhotos"] = true
      orgUpdate["settings.photoRetentionDays"] = 7
      orgUpdate["settings.fingerprintEnabled"] = true
      // Ensure allowed methods include fingerprint and photo
      orgUpdate["allowedMethods"] = ["qr", "manual", "photo", "fingerprint"]
    }

    await db.collection("organizations").updateOne(
      { _id: new ObjectId(organizationId) },
      { $set: orgUpdate }
    )
  } catch (err) {
    console.error(`Warning: Failed to update organization settings for ${organizationId}:`, err)
  }
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

  // Mark starter trials as expired (but keep status active - they can still use basic features)
  await db.collection("subscriptions").updateMany(
    {
      plan: "starter",
      isTrialActive: true,
      trialEndDate: { $lt: now },
    },
    {
      $set: {
        isTrialActive: false,
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

  // Process scheduled downgrades
  await processScheduledDowngrades()
}

/**
 * Process scheduled downgrades
 */
export async function processScheduledDowngrades(): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  // Find subscriptions with scheduled downgrades that are due
  const subscriptionsToDowngrade = await db
    .collection("subscriptions")
    .find({
      "scheduledDowngrade.scheduledFor": { $lte: now },
    })
    .toArray()

  for (const subscription of subscriptionsToDowngrade) {
    try {
      const targetPlan = subscription.scheduledDowngrade.targetPlan

      // Note: MongoDB 6.0+ supports transactions. In a production system with high availability
      // requirements, wrap both updates in a transaction to ensure atomicity.
      // For now, we rely on careful error handling and verify subscription update succeeded first.
      
      // Update subscription to new plan first (primary operation)
      const subResult = await db.collection("subscriptions").updateOne(
        { _id: subscription._id },
        {
          $set: {
            plan: targetPlan,
            amount: 0, // Will be updated on next payment
            updatedAt: now,
          },
          $unset: {
            scheduledDowngrade: "",
          },
        }
      )

      // Only update organization if subscription update succeeded
      if (subResult.modifiedCount > 0) {
        try {
          await db.collection("organizations").updateOne(
            { _id: new ObjectId(subscription.organizationId) },
            {
              $set: {
                subscriptionTier: targetPlan,
                updatedAt: now,
              },
            }
          )
        } catch (orgError) {
          // Log error but don't fail - subscription is already updated
          console.error(`Warning: Failed to update organization tier for ${subscription.organizationId}:`, orgError)
        }
      }

      console.log(`Downgraded subscription ${subscription._id} to ${targetPlan}`)
    } catch (error) {
      console.error(`Error processing downgrade for subscription ${subscription._id}:`, error)
    }
  }
}

/**
 * Cancel scheduled downgrade
 */
export async function cancelScheduledDowngrade(organizationId: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  await db.collection("subscriptions").updateOne(
    { organizationId },
    {
      $unset: {
        scheduledDowngrade: "",
      },
      $set: {
        updatedAt: now,
      },
    }
  )
}

/**
 * Downgrade subscription immediately (for starter plan)
 * Note: Both operations update separately. For full atomicity, use MongoDB transactions (6.0+)
 */
export async function downgradeSubscription(
  organizationId: string,
  targetPlan: "starter" | "professional"
): Promise<void> {
  const db = await getDatabase()
  const now = new Date()

  // Update subscription first (primary operation)
  const subResult = await db.collection("subscriptions").updateOne(
    { organizationId },
    {
      $set: {
        plan: targetPlan,
        amount: 0,
        status: "active",
        paystackSubscriptionCode: null,
        paystackCustomerCode: null,
        nextPaymentDate: null,
        updatedAt: now,
      },
      $unset: {
        scheduledDowngrade: "",
      },
    }
  )

  // Update organization tier - if this fails, subscription is already updated
  if (subResult.modifiedCount > 0) {
    try {
      await db.collection("organizations").updateOne(
        { _id: new ObjectId(organizationId) },
        {
          $set: {
            subscriptionTier: targetPlan,
            updatedAt: now,
          },
        }
      )
    } catch (error) {
      console.error(`Warning: Failed to update organization tier for ${organizationId}:`, error)
    }
  }
}

/**
 * Get subscription status for organization
 */
export async function getSubscriptionStatus(organizationId: string): Promise<{
  plan: string
  status: string
  isActive: boolean
  isTrialActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
  features: any
}> {
  const subscription = await getSubscription(organizationId)

  if (!subscription) {
    return {
      plan: "starter",
      status: "inactive",
      isActive: false,
      isTrialActive: false,
      needsUpgrade: true,
      trialDaysRemaining: null,
      features: {},
    }
  }

  const isActive = subscription.status === "active"
  let trialDaysRemaining: number | null = null
  
  // Ensure isTrialActive is explicitly set
  const isTrialActive = subscription.isTrialActive === true

  if (subscription.plan === "starter" && isTrialActive && subscription.trialEndDate) {
    const diff = subscription.trialEndDate.getTime() - getUTCDate().getTime()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const needsUpgrade = subscription.plan === "starter" && !isTrialActive

  return {
    plan: subscription.plan,
    status: subscription.status,
    isActive,
    isTrialActive,
    needsUpgrade,
    trialDaysRemaining,
    features: subscription,
  }
}
