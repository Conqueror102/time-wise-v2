/**
 * Subscription Plans Configuration
 * Defines the 3-tier pricing structure
 */

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: string
  features: string[]
  maxStaff: number
  allowedMethods: string[]
  paystackPlanCode: string | null
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    interval: "month",
    features: [
      "Free 14-day trial",
      "Up to 10 staff members",
      "ALL features unlocked during trial",
      "Photo & Fingerprint verification (trial)",
      "Full analytics & reports (trial)",
      "Basic check-in after trial",
    ],
    maxStaff: 10,
    allowedMethods: ["manual", "qr"],
    paystackPlanCode: null,
  },
  {
    id: "professional",
    name: "Professional",
    price: 5000,
    interval: "month",
    features: [
      "Up to 50 staff members",
      "Photo verification",
      "Overview & Lateness analytics",
      "Attendance history",
      "Reports access",
      "CSV export",
      "Priority support",
    ],
    maxStaff: 50,
    allowedMethods: ["manual", "qr", "photo"],
    paystackPlanCode: "PLN_professional_monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 10000,
    interval: "month",
    features: [
      "Unlimited staff members",
      "Fingerprint verification",
      "Photo verification",
      "All analytics tabs",
      "Advanced insights",
      "Full reports & history",
      "CSV export",
      "Priority support",
    ],
    maxStaff: -1, // unlimited
    allowedMethods: ["manual", "qr", "photo", "fingerprint"],
    paystackPlanCode: "PLN_enterprise_monthly",
  },
]

/**
 * Get plan by tier ID
 */
export function getPlanByTier(tier: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === tier)
}

/**
 * Check if a plan allows a specific check-in method
 */
export function canUseMethod(tier: string, method: string): boolean {
  const plan = getPlanByTier(tier)
  return plan ? plan.allowedMethods.includes(method) : false
}

/**
 * Get plan price in Naira
 */
export function getPlanPrice(tier: string): number {
  const plan = getPlanByTier(tier)
  return plan ? plan.price : 0
}

/**
 * Get formatted plan price
 */
export function getFormattedPrice(tier: string): string {
  const plan = getPlanByTier(tier)
  if (!plan) return "Free"
  if (plan.price === 0) return "Free"
  return `₦${plan.price.toLocaleString()}`
}
