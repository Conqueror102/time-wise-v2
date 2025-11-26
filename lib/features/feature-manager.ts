/**
 * Feature Management System
 * Controls feature access based on subscription plan
 * 
 * Plan Structure:
 * - Starter: Free 14-day trial with ALL features unlocked (full app experience) → after trial: basic check-in only
 * - Professional: ₦5,000, max 50 staff, photo verification, some analytics
 * - Enterprise: ₦10,000, unlimited staff, all features (fingerprint, photo, full analytics)
 */

import { getUTCDate, addDaysUTC } from "@/lib/utils/date"

export type PlanType = "starter" | "professional" | "enterprise"

export interface PlanFeatures {
  // Staff limits
  maxStaff: number
  canAddStaff: boolean
  canEditStaff: boolean
  
  // Check-in methods
  qrCheckIn: boolean
  manualCheckIn: boolean
  fingerprintCheckIn: boolean
  photoVerification: boolean
  
  // Analytics & Reports
  canAccessAnalytics: boolean
  canAccessHistory: boolean
  canAccessReports: boolean
  exportData: boolean
  
  // Analytics Tabs (granular control)
  analyticsOverview: boolean // Overview stats
  analyticsLateness: boolean // Lateness analysis
  analyticsTrends: boolean // Attendance trends (Enterprise only)
  analyticsDepartment: boolean // Department breakdown (Enterprise only)
  analyticsPerformance: boolean // Staff performance (Enterprise only)
  
  // Support
  prioritySupport: boolean
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  starter: {
    maxStaff: 10,
    canAddStaff: false, // Locked after trial
    canEditStaff: false, // Locked after trial
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: false,
    photoVerification: false,
    canAccessAnalytics: false, // Completely blocked
    canAccessHistory: false, // Completely blocked
    canAccessReports: false, // Completely blocked
    exportData: false,
    analyticsOverview: false,
    analyticsLateness: false,
    analyticsTrends: false,
    analyticsDepartment: false,
    analyticsPerformance: false,
    prioritySupport: false,
  },
  professional: {
    maxStaff: 50,
    canAddStaff: true,
    canEditStaff: true,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: false, // Locked - Enterprise only
    photoVerification: true, // Unlocked
    canAccessAnalytics: true, // Can access analytics page
    canAccessHistory: true, // Can access history page
    canAccessReports: true, // Can access reports page
    exportData: true, // CSV export available
    // Analytics tabs - only Overview and Lateness
    analyticsOverview: true,
    analyticsLateness: true,
    analyticsTrends: false, // Locked - Enterprise only
    analyticsDepartment: false, // Locked - Enterprise only
    analyticsPerformance: false, // Locked - Enterprise only
    prioritySupport: true,
  },
  enterprise: {
    maxStaff: -1, // Unlimited
    canAddStaff: true,
    canEditStaff: true,
    qrCheckIn: true,
    manualCheckIn: true,
    fingerprintCheckIn: true, // All biometrics unlocked
    photoVerification: true,
    canAccessAnalytics: true,
    canAccessHistory: true,
    canAccessReports: true,
    exportData: true,
    // Analytics tabs - all unlocked
    analyticsOverview: true,
    analyticsLateness: true,
    analyticsTrends: true,
    analyticsDepartment: true,
    analyticsPerformance: true,
    prioritySupport: true,
  },
}

// Plan pricing
export const PLAN_PRICES = {
  starter: {
    monthly: 0, // Free 14-day trial
    currency: "NGN",
    paystackPlanCode: null,
  },
  professional: {
    monthly: 5000, // ₦5,000
    currency: "NGN",
    paystackPlanCode: "PLN_professional_monthly",
  },
  enterprise: {
    monthly: 10000, // ₦10,000
    currency: "NGN",
    paystackPlanCode: "PLN_enterprise_monthly",
  },
}

/**
 * Check if organization has access to a feature
 * @param plan - Current subscription plan
 * @param feature - Feature to check access for
 * @param isTrialActive - Whether the trial is still active (for starter plan)
 * @param isDevelopment - Development mode bypasses all restrictions
 */
export function hasFeatureAccess(
  plan: PlanType,
  feature: keyof PlanFeatures,
  isTrialActive: boolean = false,
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

  // Special handling for starter plan during trial
  // During trial, Starter gets ALL features unlocked (full app experience)
  if (plan === "starter" && isTrialActive) {
    // All features unlocked during trial, including fingerprint
    return true
  }

  // For non-trial starter or other plans, use PLAN_FEATURES
  const planFeatures = PLAN_FEATURES[plan]
  return planFeatures?.[feature] as boolean ?? false
}

/**
 * Check if organization can add more staff
 */
export function canAddStaff(
  plan: PlanType,
  currentStaffCount: number,
  isTrialActive: boolean = false,
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

  // Starter plan after trial expires - can't add staff
  if (plan === "starter" && !isTrialActive) {
    return false
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

  // If on starter and trial expired
  if (plan === "starter" && trialEndDate && isTrialExpired(trialEndDate)) {
    return true
  }

  return false
}

/**
 * Get feature gate message for upgrade prompts
 */
export function getFeatureGateMessage(feature: keyof PlanFeatures, plan: PlanType): string {
  const messages: Partial<Record<keyof PlanFeatures, string>> = {
    canAddStaff: plan === "starter" 
      ? "Your trial has expired. Upgrade to Professional or Enterprise to add and manage staff."
      : `Your ${plan} plan has reached the maximum of ${PLAN_FEATURES[plan].maxStaff} staff. Upgrade to add more.`,
    canEditStaff: "Your trial has expired. Upgrade to Professional or Enterprise to edit staff members.",
    fingerprintCheckIn: "Fingerprint verification is only available in the Enterprise plan. Upgrade to unlock biometric authentication.",
    photoVerification: plan === "starter"
      ? "Photo verification is locked. Upgrade to Professional or Enterprise to unlock this feature."
      : "Photo verification is only available in Professional and Enterprise plans.",
    canAccessAnalytics: "Analytics are locked. Upgrade to Professional or Enterprise to access detailed insights.",
    canAccessHistory: "Attendance history is locked. Upgrade to Professional or Enterprise to view records.",
    canAccessReports: "Reports are locked. Upgrade to Professional or Enterprise to generate reports.",
    exportData: "Data export is only available in Professional and Enterprise plans.",
    analyticsTrends: "Attendance trends analysis is only available in the Enterprise plan. Upgrade for advanced insights.",
    analyticsDepartment: "Department analytics are only available in the Enterprise plan. Upgrade for team insights.",
    analyticsPerformance: "Staff performance analytics are only available in the Enterprise plan. Upgrade for detailed reports.",
    prioritySupport: "Priority support is available in Professional and Enterprise plans.",
  }

  return messages[feature] || "This feature is not available in your current plan. Upgrade to unlock."
}

/**
 * Get recommended plan for a locked feature
 */
export function getRecommendedPlan(feature: keyof PlanFeatures): PlanType {
  // Features that require Enterprise
  const enterpriseFeatures: (keyof PlanFeatures)[] = [
    "fingerprintCheckIn",
    "analyticsTrends",
    "analyticsDepartment",
    "analyticsPerformance",
  ]
  
  if (enterpriseFeatures.includes(feature)) {
    return "enterprise"
  }
  
  // Most other features available in Professional
  return "professional"
}
