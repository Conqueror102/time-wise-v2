"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Lock, Unlock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DevPlansPage() {
  const router = useRouter()
  const [isDev, setIsDev] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string>("starter")
  const [isTrialActive, setIsTrialActive] = useState(true)

  useEffect(() => {
    const checkDevMode = async () => {
      try {
        const res = await fetch("/api/dev/check")
        const data = await res.json()
        setIsDev(data.isDevelopment)
        
        if (!data.isDevelopment) {
          router.push("/dashboard")
        }
      } catch (error) {
        setIsDev(false)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    checkDevMode()
  }, [router])

  const switchPlan = async (plan: string, trialActive: boolean = false) => {
    try {
      const res = await fetch("/api/dev/switch-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, isTrialActive: trialActive })
      })

      if (res.ok) {
        setCurrentPlan(plan)
        setIsTrialActive(trialActive)
      }
    } catch (error) {
      console.error("Failed to switch plan:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking environment...</p>
        </div>
      </div>
    )
  }

  if (!isDev) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="destructive" className="text-sm">DEV MODE</Badge>
            <h1 className="text-3xl font-bold text-gray-900">Plan Testing</h1>
          </div>
          <p className="text-gray-600">
            Test different subscription plans and trial states. All features unlocked in dev mode.
          </p>
        </div>

        <Card className="mb-8 border-2 border-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <p className="text-2xl font-bold capitalize">{currentPlan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Trial Status</p>
                <Badge variant={isTrialActive ? "default" : "secondary"}>
                  {isTrialActive ? "Active" : "Expired"}
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                <span className="font-medium">Dev Mode: All features unlocked regardless of plan</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={currentPlan === "starter" && isTrialActive ? "border-2 border-blue-600" : ""}>
            <CardHeader>
              <CardTitle className="text-xl">Starter (Trial Active)</CardTitle>
              <p className="text-sm text-gray-600">14-day trial</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Max 10 staff</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>ALL features unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Including fingerprint</span>
                </li>
              </ul>
              <Button 
                onClick={() => switchPlan("starter", true)}
                className="w-full"
                variant={currentPlan === "starter" && isTrialActive ? "default" : "outline"}
              >
                Switch to This
              </Button>
            </CardContent>
          </Card>

          <Card className={currentPlan === "starter" && !isTrialActive ? "border-2 border-blue-600" : ""}>
            <CardHeader>
              <CardTitle className="text-xl">Starter (Trial Expired)</CardTitle>
              <p className="text-sm text-gray-600">After 14 days</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Basic check-in only</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Analytics locked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>History locked</span>
                </li>
              </ul>
              <Button 
                onClick={() => switchPlan("starter", false)}
                className="w-full"
                variant={currentPlan === "starter" && !isTrialActive ? "default" : "outline"}
              >
                Switch to This
              </Button>
            </CardContent>
          </Card>

          <Card className={currentPlan === "professional" ? "border-2 border-blue-600" : ""}>
            <CardHeader>
              <CardTitle className="text-xl">Professional</CardTitle>
              <p className="text-sm text-gray-600">₦5,000/month</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Max 50 staff</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Photo verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Fingerprint locked</span>
                </li>
              </ul>
              <Button 
                onClick={() => switchPlan("professional", false)}
                className="w-full"
                variant={currentPlan === "professional" ? "default" : "outline"}
              >
                Switch to This
              </Button>
            </CardContent>
          </Card>

          <Card className={currentPlan === "enterprise" ? "border-2 border-blue-600" : ""}>
            <CardHeader>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <p className="text-sm text-gray-600">₦10,000/month</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Unlimited staff</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>All features unlocked</span>
                </li>
              </ul>
              <Button 
                onClick={() => switchPlan("enterprise", false)}
                className="w-full"
                variant={currentPlan === "enterprise" ? "default" : "outline"}
              >
                Switch to This
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}