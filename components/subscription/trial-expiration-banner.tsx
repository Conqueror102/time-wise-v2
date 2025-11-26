"use client"

/**
 * Trial Expiration Banner
 * Shows notification when trial is about to expire or has expired
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, Crown, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/hooks/use-subscription"

export function TrialExpirationBanner() {
  const router = useRouter()
  const { subscription, loading, isDevelopment } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Don't show in development mode
  if (isDevelopment) {
    return null
  }

  if (loading || !subscription) {
    return null
  }

  // Only show for starter plan
  if (subscription.plan !== "starter") {
    return null
  }

  // Don't show if dismissed
  if (dismissed) {
    return null
  }

  const daysRemaining = subscription.trialDaysRemaining ?? 0
  const isTrialActive = subscription.isTrialActive
  const isExpired = !isTrialActive

  // Show banner if:
  // 1. Trial expired
  // 2. Trial ending soon (3 days or less)
  const shouldShow = isExpired || (isTrialActive && daysRemaining <= 3)

  if (!shouldShow) {
    return null
  }

  const handleUpgrade = () => {
    router.push("/dashboard/subscription")
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in session storage (resets on page refresh)
    sessionStorage.setItem("trialBannerDismissed", "true")
  }

  // Check if already dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("trialBannerDismissed")
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  if (isExpired) {
    // Trial has expired
    return (
      <div className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Your Trial Has Expired</h3>
                <p className="text-sm text-white/90">
                  Upgrade now to continue using analytics, reports, and advanced features. Basic check-in is still available.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUpgrade}
                className="bg-white text-red-600 hover:bg-gray-100 font-semibold shadow-lg"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Trial ending soon (3 days or less)
  return (
    <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {daysRemaining === 0 
                  ? "Your Trial Ends Today!" 
                  : `${daysRemaining} Day${daysRemaining === 1 ? "" : "s"} Left in Your Trial`}
              </h3>
              <p className="text-sm text-white/90">
                Don't lose access to analytics, reports, and advanced features. Upgrade now to keep everything unlocked!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpgrade}
              className="bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
