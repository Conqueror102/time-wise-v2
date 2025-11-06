/**
 * Feature Management System
 * Controls feature access based on subscription plan
 */

import { getUTCDate, addDaysUTC } from "@/lib/utils/date"

export type PlanType = "free_trial" | "starter" | "professional" | "enterprise" | "free"

export interface PlanFeatures {
  maxStaff: number
  qrCheckIn: boolean
  manualCheckIn: boolean
  fingerprintCheckIn: boolean
  faceCheckIn: boolean
  basicReports: boolean
  advancedAnalytics: boolean
  exportData: boolean
  photoVerification: boolean
  apiAccess: boolean
  customBranding: boolean
  prioritySupport: boolean
  dedicatedSupport: boolean
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free_trial: {
    maxStaff: 10,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: true,
    faceCheckIn: true,
    basicReports: true,
    advancedAnalytics: false,
    exportData: false,
    photoVerification: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    dedicatedSupport: false,
  },
  free: {
    // Legacy plan type - same as free_trial
    maxStaff: 10,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: true,
    faceCheckIn: true,
    basicReports: true,
    advancedAnalytics: false,
    exportData: false,
    photoVerification: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    dedicatedSupport: false,
  },
  starter: {
    maxStaff: 10,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: false,
    faceCheckIn: false,
    basicReports: true,
    advancedAnalytics: false,
    exportData: false,
    photoVerification: false,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    dedicatedSupport: false,
  },
  professional: {
    maxStaff: 50,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: true,
    faceCheckIn: true,
    basicReports: true,
    advancedAnalytics: true,
    exportData: true,
    photoVerification: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: true,
    dedicatedSupport: false,
  },
  enterprise: {
    maxStaff: -1, // Unlimited
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: true,
    faceCheckIn: true,
    basicReports: true,
    advancedAnalytics: true,
    exportData: true,
    photoVerification: true,
    apiAccess: true,
    customBranding: true,
    prioritySupport: true,
    dedicatedSupport: true,
  },
}

export const PLAN_PRICES = {
  starter: {
    monthly: 0,
    currency: "NGN",
    paystackPlanCode: null,
  },
  professional: {
    monthly: 29000, // 29,000 NGN (~$29)
    currency: "NGN",
    paystackPlanCode: "PLN_professional_monthly",
  },
  enterprise: {
    monthly: 99000, // 99,000 NGN (~$99)
    currency: "NGN",
    paystackPlanCode: "PLN_enterprise_monthly",
  },
}

/**
 * Check if organization has access to a feature
 */
export function hasFeatureAccess(
  plan: PlanType,
  feature: keyof PlanFeatures,
  isDevelopment: boolean = false
): boolean {
  // In development mode, all features are unlocked
  if (isDevelopment) {
    return true
  }

  // Handle undefined or invalid plan
  if (!plan || !PLAN_FEATURES[plan]) {
    console.warn(`Invalid plan type: ${plan}, defaulting to starter`)
    plan = "starter"
  }

  const planFeatures = PLAN_FEATURES[plan]
  return planFeatures?.[feature] as boolean ?? false
}

/**
 * Check if organization can add more staff
 */
export function canAddStaff(
  plan: PlanType,
  currentStaffCount: number,
  isDevelopment: boolean = false
): boolean {
  // In development mode, unlimited staff
  if (isDevelopment) {
    return true
  }

  // Handle undefined or invalid plan
  if (!plan || !PLAN_FEATURES[plan]) {
    console.warn(`Invalid plan type in canAddStaff: ${plan}, defaulting to starter`)
    plan = "starter"
  }

  const maxStaff = PLAN_FEATURES[plan]?.maxStaff ?? 10
  
  // -1 means unlimited
  if (maxStaff === -1) {
    return true
  }

  return currentStaffCount < maxStaff
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(trialEndDate: Date): boolean {
  return getUTCDate() > trialEndDate
}

/**
 * Calculate trial end date (14 days from start)
 */
export function calculateTrialEndDate(startDate: Date = getUTCDate()): Date {
  return addDaysUTC(startDate, 14)
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialEndDate: Date): number {
  const now = getUTCDate()
  const diff = trialEndDate.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

/**
 * Check if organization needs to upgrade
 */
export function needsUpgrade(
  plan: PlanType,
  trialEndDate: Date | null,
  isDevelopment: boolean = false
): boolean {
  // In development mode, never needs upgrade
  if (isDevelopment) {
    return false
  }

  // If on free trial and expired
  if (plan === "free_trial" && trialEndDate && isTrialExpired(trialEndDate)) {
    return true
  }

  return false
}

/**
 * Get feature gate message
 */
export function getFeatureGateMessage(feature: keyof PlanFeatures, plan: PlanType): string {
  const messages: Record<keyof PlanFeatures, string> = {
    maxStaff: `Your ${plan} plan has reached the maximum staff limit. Upgrade to add more staff.`,
    qrCheckIn: "QR code check-in is not available in your plan. Upgrade to unlock this feature.",
    manualCheckIn: "Manual check-in is not available in your plan. Upgrade to unlock this feature.",
    fingerprintCheckIn: "Fingerprint check-in is not available in your plan. Upgrade to Professional or Enterprise.",
    faceCheckIn: "Face recognition check-in is not available in your plan. Upgrade to Professional or Enterprise.",
    basicReports: "Basic reports are not available in your plan. Upgrade to unlock this feature.",
    advancedAnalytics: "Advanced analytics are only available in Professional and Enterprise plans.",
    exportData: "Data export is only available in Professional and Enterprise plans.",
    photoVerification: "Photo verification is only available in Professional and Enterprise plans.",
    apiAccess: "API access is only available in the Enterprise plan.",
    customBranding: "Custom branding is only available in the Enterprise plan.",
    prioritySupport: "Priority support is available in Professional and Enterprise plans.",
    dedicatedSupport: "Dedicated support is only available in the Enterprise plan.",
  }

  return messages[feature] || "This feature is not available in your current plan."
}
