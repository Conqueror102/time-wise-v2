"use client"

/**
 * Subscription Hook
 * Provides subscription status and feature access checks
 */

import { useEffect, useState } from "react"
import { PlanType, PlanFeatures, hasFeatureAccess, canAddStaff as checkCanAddStaff } from "@/lib/features/feature-manager"

interface SubscriptionData {
  plan: PlanType
  status: string
  isActive: boolean
  isTrialActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const isDevelopment = process.env.NODE_ENV === "development"

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscription/status")
        if (res.ok) {
          const data = await res.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!subscription) return false
    return hasFeatureAccess(
      subscription.plan,
      feature,
      subscription.isTrialActive,
      isDevelopment
    )
  }

  const canAddStaff = (currentStaffCount: number): boolean => {
    if (!subscription) return false
    return checkCanAddStaff(
      subscription.plan,
      currentStaffCount,
      subscription.isTrialActive,
      isDevelopment
    )
  }

  return {
    subscription,
    loading,
    hasFeature,
    canAddStaff,
    isDevelopment,
  }
}
