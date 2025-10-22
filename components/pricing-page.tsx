"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Shield, Star, Sparkles } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"

interface PricingPageProps {
  currentTier?: string
  onSelectPlan: (planId: string) => void
}

export function PricingPage({ currentTier, onSelectPlan }: PricingPageProps) {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month")

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Star className="w-6 h-6" />
      case "basic":
        return <Zap className="w-6 h-6" />
      case "premium":
        return <Shield className="w-6 h-6" />
      case "enterprise":
        return <Crown className="w-6 h-6" />
      default:
        return <Star className="w-6 h-6" />
    }
  }

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case "free":
        return "from-gray-500 to-gray-600"
      case "basic":
        return "from-blue-500 to-blue-600"
      case "premium":
        return "from-purple-500 to-purple-600"
      case "enterprise":
        return "from-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const isCurrentPlan = (planId: string) => currentTier === planId

  return (
    <div className="web-app-container min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-navy mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock powerful attendance management features for your organization
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${billingInterval === "month" ? "text-primary-navy font-semibold" : "text-gray-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingInterval === "year" ? "bg-primary-navy" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${
                  billingInterval === "year" ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${billingInterval === "year" ? "text-primary-navy font-semibold" : "text-gray-500"}`}
            >
              Yearly
            </span>
            {billingInterval === "year" && (
              <Badge className="bg-green-100 text-green-800 ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const yearlyPrice = Math.round(plan.price * 12 * 0.8) // 20% discount
            const displayPrice = billingInterval === "year" ? yearlyPrice : plan.price
            const isPopular = plan.id === "premium"
            const isEnterprise = plan.id === "enterprise"

            return (
              <Card
                key={plan.id}
                className={`relative modern-card transition-all duration-300 hover:scale-105 ${
                  isPopular ? "ring-2 ring-purple-500 shadow-xl" : ""
                } ${isEnterprise ? "bg-gradient-to-br from-yellow-50 to-purple-50" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}

                {isEnterprise && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-purple-500 text-white px-4 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-r ${getPlanGradient(plan.id)} rounded-xl flex items-center justify-center text-white`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-xl text-primary-navy">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-primary-navy">
                      ${displayPrice}
                      {plan.price > 0 && <span className="text-sm font-normal text-gray-600">/{billingInterval}</span>}
                    </div>
                    {billingInterval === "year" && plan.price > 0 && (
                      <div className="text-sm text-gray-500 line-through">
                        ${plan.price * 12}/{billingInterval}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Authentication Methods:</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.allowedMethods.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => onSelectPlan(plan.id)}
                    disabled={isCurrentPlan(plan.id)}
                    className={`w-full ${
                      isCurrentPlan(plan.id)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : plan.id === "enterprise"
                          ? "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-white"
                          : plan.id === "premium"
                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                            : "btn-primary"
                    }`}
                  >
                    {isCurrentPlan(plan.id) ? "Current Plan" : `Get ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Need a custom solution? Contact our sales team for enterprise pricing.</p>
          <Button
            variant="outline"
            className="border-primary-navy text-primary-navy hover:bg-primary-navy hover:text-white"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}
