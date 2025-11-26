"use client"

/**
 * Feature Gate Component
 * Wraps content and shows upgrade prompt if feature is locked
 */

import { ReactNode, useState } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { PlanFeatures, getFeatureGateMessage } from "@/lib/features/feature-manager"
import { UpgradeModal } from "./upgrade-modal"
import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FeatureGateProps {
  feature: keyof PlanFeatures
  children: ReactNode
  fallback?: ReactNode
  showLockOverlay?: boolean
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showLockOverlay = true 
}: FeatureGateProps) {
  const { hasFeature, subscription, loading } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasAccess = hasFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  // Feature is locked
  if (fallback) {
    return <>{fallback}</>
  }

  // Default locked UI
  if (showLockOverlay) {
    return (
      <>
        <Card className="border-2 border-gray-200 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100/90 to-gray-200/90 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Feature Locked</h3>
              <p className="text-gray-600 mb-6">
                {getFeatureGateMessage(feature, subscription?.plan || "starter")}
              </p>
              <Button 
                onClick={() => setShowUpgrade(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
          <CardContent className="p-8 opacity-30 pointer-events-none">
            {children}
          </CardContent>
        </Card>

        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
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
          currentPlan={subscription?.plan || "starter"}
        />
      </>
    )
  }

  return null
}
