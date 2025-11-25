"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface SubscriptionStatus {
  plan: string
  status: string
  isActive: boolean
  isTrialActive: boolean
  needsUpgrade: boolean
  trialDaysRemaining: number | null
}

export function SubscriptionStatusCard() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
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

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) return null

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "starter":
        return "bg-blue-100 text-blue-700"
      case "professional":
        return "bg-purple-100 text-purple-700"
      case "enterprise":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const isTrialExpired = subscription.plan === "starter" && !subscription.isTrialActive
  const showUpgradePrompt = subscription.needsUpgrade || isTrialExpired

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <CardDescription>Your current plan</CardDescription>
            </div>
          </div>
          <Badge className={getPlanColor(subscription.plan)}>
            {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial Status */}
        {subscription.isTrialActive && subscription.trialDaysRemaining !== null && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Trial Active</p>
              <p className="text-sm text-blue-700">
                {subscription.trialDaysRemaining} {subscription.trialDaysRemaining === 1 ? "day" : "days"} remaining
              </p>
            </div>
          </div>
        )}

        {/* Trial Expired */}
        {isTrialExpired && (
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">Trial Expired</p>
              <p className="text-sm text-orange-700">
                Upgrade to unlock all features
              </p>
            </div>
          </div>
        )}

        {/* Active Subscription */}
        {subscription.isActive && !subscription.isTrialActive && subscription.plan !== "starter" && (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Active Subscription</p>
              <p className="text-sm text-green-700">
                All features unlocked
              </p>
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {showUpgradePrompt && (
          <Link href="/dashboard/pricing">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              Upgrade Plan
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
