"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Shield, Star, ArrowRight } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import type { Organization } from "@/lib/models"

interface SubscriptionGateProps {
  organization: Organization
  requiredTier: string
  feature: string
  onUpgrade: () => void
}

export function SubscriptionGate({ organization, requiredTier, feature, onUpgrade }: SubscriptionGateProps) {
  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === organization.subscriptionTier)
  const requiredPlan = SUBSCRIPTION_PLANS.find((p) => p.id === requiredTier)

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "basic":
        return <Zap className="w-5 h-5" />
      case "premium":
        return <Shield className="w-5 h-5" />
      case "enterprise":
        return <Crown className="w-5 h-5" />
      default:
        return <Star className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            {getPlanIcon(requiredTier)}
          </div>
          <CardTitle className="text-xl text-primary-navy">Upgrade Required</CardTitle>
          <CardDescription>
            {feature} is available in the {requiredPlan?.name} plan and above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="text-gray-600">
                Current Plan
              </Badge>
              <Badge className="bg-primary-navy text-white">{currentPlan?.name}</Badge>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-gray-600">
                Required Plan
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{requiredPlan?.name}</Badge>
            </div>
          </div>

          {requiredPlan && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-primary-navy">
                  ${requiredPlan.price}
                  <span className="text-sm font-normal text-gray-600">/{requiredPlan.interval}</span>
                </div>
              </div>
              <div className="space-y-2">
                {requiredPlan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {requiredPlan.features.length > 3 && (
                  <div className="text-sm text-gray-500">+{requiredPlan.features.length - 3} more features</div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
