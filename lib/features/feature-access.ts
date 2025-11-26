/**
 * Backend Feature Access Checker
 * Fetches subscription data and checks feature access
 */

import { getDatabase } from "@/lib/mongodb"
import { hasFeatureAccess as checkFeatureAccess, PlanFeatures, PlanType } from "./feature-manager"
import { getSubscription } from "@/lib/subscription/subscription-manager"

/**
 * Check if a tenant has access to a feature (backend version)
 * Fetches subscription data from database
 */
export async function hasFeatureAccess(
  tenantId: string,
  feature: keyof PlanFeatures,
  isDevelopment: boolean = false
): Promise<boolean> {
  // In development mode, all features are unlocked
  if (isDevelopment) {
    return true
  }

  try {
    // Get subscription from database
    const subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      // No subscription found, default to starter with no trial
      return checkFeatureAccess("starter", feature, false, isDevelopment)
    }

    // Check feature access
    return checkFeatureAccess(
      subscription.plan as PlanType,
      feature,
      subscription.isTrialActive ?? false,
      isDevelopment
    )
  } catch (error) {
    console.error("Error checking feature access:", error)
    // On error, deny access (fail closed)
    return false
  }
}

/**
 * Check if tenant can add more staff (backend version)
 */
export async function canAddStaff(
  tenantId: string,
  currentStaffCount: number,
  isDevelopment: boolean = false
): Promise<boolean> {
  // In development mode, unlimited staff
  if (isDevelopment) {
    return true
  }

  try {
    const subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      // No subscription, default to starter limits
      return currentStaffCount < 10
    }

    const maxStaff = subscription.plan === "enterprise" ? -1 : 
                     subscription.plan === "professional" ? 50 : 10

    // Starter plan after trial expires - can't add staff
    if (subscription.plan === "starter" && !subscription.isTrialActive) {
      return false
    }

    // -1 means unlimited
    if (maxStaff === -1) {
      return true
    }

    return currentStaffCount < maxStaff
  } catch (error) {
    console.error("Error checking staff limit:", error)
    return false
  }
}
