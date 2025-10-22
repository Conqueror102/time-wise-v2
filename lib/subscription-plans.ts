import type { SubscriptionPlan } from "./models"

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    features: ["Manual ID check-in only", "Up to 10 staff members", "Basic attendance reports", "Email support"],
    maxStaff: 10,
    allowedMethods: ["manual"],
    stripePriceId: "",
  },
  {
    id: "basic",
    name: "Basic",
    price: 29,
    interval: "month",
    features: [
      "Manual ID + QR Code check-in",
      "Up to 50 staff members",
      "Advanced attendance reports",
      "CSV export",
      "Priority email support",
    ],
    maxStaff: 50,
    allowedMethods: ["manual", "qr"],
    stripePriceId: "price_basic_monthly",
  },
  {
    id: "premium",
    name: "Premium",
    price: 79,
    interval: "month",
    features: [
      "All Basic features",
      "Fingerprint authentication",
      "Up to 200 staff members",
      "Real-time dashboard",
      "API access",
      "Phone support",
    ],
    maxStaff: 200,
    allowedMethods: ["manual", "qr", "fingerprint"],
    stripePriceId: "price_premium_monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    interval: "month",
    features: [
      "All Premium features",
      "Face recognition",
      "Unlimited staff members",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "Choose preferred auth method",
    ],
    maxStaff: -1, // unlimited
    allowedMethods: ["manual", "qr", "fingerprint", "face"],
    stripePriceId: "price_enterprise_monthly",
  },
]

export function getPlanByTier(tier: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === tier)
}

export function canUseMethod(tier: string, method: string): boolean {
  const plan = getPlanByTier(tier)
  return plan ? plan.allowedMethods.includes(method as any) : false
}
