"use client"

import { useEffect, useState } from "react"
import { Crown, Calendar, AlertCircle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface SubscriptionStatus {
  plan: string
  status: string
  isActive: boolean
  isTrialActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
}

export function SubscriptionIndicator() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch("/api/subscription/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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

  if (loading || !subscription) return null

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "starter":
        return "bg-blue-600"
      case "professional":
        return "bg-purple-600"
      case "enterprise":
        return "bg-amber-600"
      default:
        return "bg-gray-600"
    }
  }

  const isTrialExpired = subscription.plan === "starter" && !subscription.isTrialActive
  const showWarning = subscription.isTrialActive && subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining <= 3

  return (
    <>
      {/* Sidebar Indicator */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-3 mb-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{subscription.plan}</span>
          </div>
          {subscription.isTrialActive && subscription.trialDaysRemaining !== null && (
            <Badge className="bg-white/20 text-white text-xs">
              {subscription.trialDaysRemaining}d
            </Badge>
          )}
          {isTrialExpired && (
            <AlertCircle className="w-4 h-4 text-yellow-300" />
          )}
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            {/* Header */}
            <div className="relative px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${getPlanColor(subscription.plan)} rounded-lg flex items-center justify-center`}>
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Subscription</h3>
                  <p className="text-xs text-gray-500">Current plan status</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Plan Badge */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Plan</span>
                <Badge className={`${getPlanColor(subscription.plan)} text-white text-xs`}>
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                </Badge>
              </div>

              {/* Trial Active */}
              {subscription.isTrialActive && subscription.trialDaysRemaining !== null && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  showWarning ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"
                }`}>
                  <Calendar className={`w-4 h-4 mt-0.5 flex-shrink-0 ${showWarning ? "text-orange-600" : "text-blue-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${showWarning ? "text-orange-900" : "text-blue-900"}`}>
                      Trial Active
                    </p>
                    <p className={`text-xs mt-0.5 ${showWarning ? "text-orange-700" : "text-blue-700"}`}>
                      <span className="font-semibold">{subscription.trialDaysRemaining}</span>{" "}
                      {subscription.trialDaysRemaining === 1 ? "day" : "days"} left
                    </p>
                  </div>
                </div>
              )}

              {/* Trial Expired */}
              {isTrialExpired && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-900">Trial Expired</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Upgrade to unlock features
                    </p>
                  </div>
                </div>
              )}

              {/* Active Paid */}
              {subscription.isActive && !subscription.isTrialActive && subscription.plan !== "starter" && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-900">Active</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      All features unlocked
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
                {(subscription.needsUpgrade || isTrialExpired) && (
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    onClick={() => {
                      setShowModal(false)
                      router.push("/dashboard/subscription")
                    }}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
