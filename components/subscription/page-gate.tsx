"use client"

/**
 * Page Gate Component
 * Shows upgrade modal when trying to access locked pages
 */

import { ReactNode, useState, useEffect } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { PlanFeatures, getFeatureGateMessage } from "@/lib/features/feature-manager"
import { UpgradeModal } from "./upgrade-modal"

interface PageGateProps {
  feature: keyof PlanFeatures
  children: ReactNode
}

export function PageGate({ feature, children }: PageGateProps) {
  const { hasFeature, subscription, loading } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Show modal immediately when page is locked
  useEffect(() => {
    if (!loading && !hasFeature(feature)) {
      setShowUpgradeModal(true)
    }
  }, [loading, feature, hasFeature])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const hasAccess = hasFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  // Page is locked - show modal
  const currentPlan = subscription?.plan || "starter"

  return (
    <>
      {/* Blurred background */}
      <div className="blur-sm pointer-events-none opacity-50">
        {children}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={async (plan) => {
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
          if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl
          }
        }}
        currentPlan={currentPlan}
      />
    </>
  )
}
