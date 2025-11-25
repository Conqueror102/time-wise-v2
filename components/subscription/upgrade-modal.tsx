"use client"

/**
 * Upgrade Modal
 * Universal modal for upgrading subscription plans
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: (plan: "professional" | "enterprise") => void
  currentPlan: string
  loading?: boolean
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  currentPlan,
  loading = false
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"professional" | "enterprise">("professional")

  if (!isOpen) return null

  const canUpgrade = (planId: string): boolean => {
    const hierarchy = { starter: 0, professional: 1, enterprise: 2 }
    const currentLevel = hierarchy[currentPlan as keyof typeof hierarchy] || 0
    const targetLevel = hierarchy[planId as keyof typeof hierarchy] || 0
    return targetLevel > currentLevel
  }

  const availablePlans = SUBSCRIPTION_PLANS.filter(plan => canUpgrade(plan.id))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as "professional" | "enterprise")}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {selectedPlan === plan.id && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onUpgrade(selectedPlan)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Processing..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    </div>
  )
}
