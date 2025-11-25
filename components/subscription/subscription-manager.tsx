"use client"

/**
 * Subscription Management Component
 * Handles upgrade, downgrade, and cancellation
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Check, 
  X, 
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  XCircle
} from "lucide-react"
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscription-plans"
import { UpgradeModal } from "./upgrade-modal"

interface SubscriptionStatus {
  plan: string
  status: string
  isActive: boolean
  isTrialActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
  features: any
}

export function SubscriptionManager() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedDowngrade, setSelectedDowngrade] = useState<"starter" | "professional">("starter")

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/subscription/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to fetch subscription status:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: "professional" | "enterprise") => {
    setActionLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetPlan: plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize upgrade")
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorizationUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize upgrade")
      setActionLoading(false)
    }
  }

  const handleDowngrade = async (plan: "starter" | "professional") => {
    setActionLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetPlan: plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule downgrade")
      }

      setSuccess(data.message)
      setShowDowngradeModal(false)
      await fetchSubscriptionStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule downgrade")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelDowngrade = async () => {
    setActionLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/subscription/downgrade/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel downgrade")
      }

      setSuccess(data.message)
      await fetchSubscriptionStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel downgrade")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setActionLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription")
      }

      setSuccess(data.message)
      setShowCancelModal(false)
      await fetchSubscriptionStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription")
    } finally {
      setActionLoading(false)
    }
  }

  const getCurrentPlan = (): SubscriptionPlan | undefined => {
    return SUBSCRIPTION_PLANS.find(p => p.id === status?.plan)
  }

  const canUpgrade = (targetPlan: string): boolean => {
    const hierarchy = { starter: 0, professional: 1, enterprise: 2 }
    const currentLevel = hierarchy[status?.plan as keyof typeof hierarchy] || 0
    const targetLevel = hierarchy[targetPlan as keyof typeof hierarchy] || 0
    return targetLevel > currentLevel
  }

  const canDowngrade = (targetPlan: string): boolean => {
    const hierarchy = { starter: 0, professional: 1, enterprise: 2 }
    const currentLevel = hierarchy[status?.plan as keyof typeof hierarchy] || 0
    const targetLevel = hierarchy[targetPlan as keyof typeof hierarchy] || 0
    return targetLevel < currentLevel
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  const currentPlan = getCurrentPlan()
  const scheduledDowngrade = status?.features?.scheduledDowngrade

  return (
    <div className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold capitalize">{status?.plan} Plan</h3>
              <p className="text-gray-600">
                {currentPlan?.price === 0 
                  ? "Free" 
                  : `₦${currentPlan?.price.toLocaleString()}/month`}
              </p>
            </div>
            <Badge variant={status?.isActive ? "default" : "secondary"}>
              {status?.status}
            </Badge>
          </div>

          {/* Trial Info */}
          {status?.isTrialActive && status?.trialDaysRemaining !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Trial Active</span>
              </div>
              <p className="text-sm text-blue-800">
                {status.trialDaysRemaining} days remaining in your free trial
              </p>
            </div>
          )}

          {/* Scheduled Downgrade Warning */}
          {scheduledDowngrade && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Downgrade Scheduled</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelDowngrade}
                  disabled={actionLoading}
                >
                  Cancel Downgrade
                </Button>
              </div>
              <p className="text-sm text-yellow-800">
                Your plan will change to <strong className="capitalize">{scheduledDowngrade.targetPlan}</strong> on{" "}
                {new Date(scheduledDowngrade.scheduledFor).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {status?.plan !== "enterprise" && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
            {status?.plan !== "starter" && !scheduledDowngrade && (
              <Button
                onClick={() => setShowDowngradeModal(true)}
                variant="outline"
                className="flex-1"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Downgrade Plan
              </Button>
            )}
            {status?.plan !== "starter" && (
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        currentPlan={status?.plan || "starter"}
        loading={actionLoading}
      />

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Downgrade Your Plan</h2>
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Important Information</span>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                <li>• Downgrade will take effect at the end of your current billing period</li>
                <li>• You'll retain access to current features until then</li>
                <li>• Some features may be locked after downgrade</li>
                <li>• Staff limits will apply based on the new plan</li>
              </ul>
            </div>

            <div className="space-y-3 mb-6">
              {SUBSCRIPTION_PLANS.filter(plan => canDowngrade(plan.id)).map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedDowngrade(plan.id as "starter" | "professional")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDowngrade === plan.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}/month`}
                      </p>
                    </div>
                    {selectedDowngrade === plan.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDowngradeModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDowngrade(selectedDowngrade)}
                disabled={actionLoading}
                variant="destructive"
                className="flex-1"
              >
                {actionLoading ? "Processing..." : "Schedule Downgrade"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Cancel Subscription</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Are you sure?</span>
              </div>
              <p className="text-sm text-red-800">
                Your subscription will be cancelled, but you'll retain access until the end of your current billing period.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                variant="destructive"
                className="flex-1"
              >
                {actionLoading ? "Processing..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
