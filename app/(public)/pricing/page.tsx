"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [pricing, setPricing] = useState({ monthlyPrice: 4000, formattedPrice: "₦4,000" })

  // Fetch dynamic pricing
  useEffect(() => {
    fetch("/api/pricing")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPricing(data.pricing)
        }
      })
      .catch(err => console.error("Failed to fetch pricing:", err))
  }, [])

  const handleSelectPlan = async (plan: "trial" | "paid") => {
    if (plan === "trial") {
      // Free trial - redirect to register
      router.push("/register")
      return
    }

    setLoading(plan)

    try {
      // Check if user is logged in
      const token = localStorage.getItem("accessToken")
      
      if (!token) {
        // Not logged in - redirect to register with plan
        router.push(`/register?plan=${plan}`)
        return
      }

      // Logged in - initialize payment for paid plan
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "paid" }),
      })

      const data = await response.json()

      if (data.success && data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl
      } else {
        alert(data.error || "Failed to initialize payment")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">TimeWise</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 font-medium">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your team
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                14-day free trial • No credit card required
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial */}
            <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">14-Day Free Trial</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">₦0</span>
                  </div>
                  <p className="text-gray-600 mt-2">Try all features risk-free</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited staff members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">All check-in methods (QR, Manual, Face, Biometric)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Photo verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced analytics & reports</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Export to CSV/Excel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Full access for 14 days</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full h-12 font-medium" 
                  variant="outline"
                  onClick={() => handleSelectPlan("trial")}
                  disabled={loading !== null}
                >
                  {loading === "trial" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">No credit card required</p>
              </CardContent>
            </Card>

            {/* Paid Plan */}
            <Card className="border-2 border-blue-600 hover:border-blue-700 transition-all duration-300 bg-white relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Best Value
              </div>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Full Access</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">{pricing.formattedPrice}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mt-2">Everything you need, forever</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Everything in Free Trial, plus:</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited staff members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">All check-in methods</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">API access</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleSelectPlan("paid")}
                  disabled={loading !== null}
                >
                  {loading === "paid" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">Start with 14-day free trial</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
            <p className="text-sm text-gray-500">
              Questions? <a href="mailto:support@timewise.com" className="text-blue-600 hover:underline">Contact support</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TimeWise</span>
            </div>
            <p className="text-sm">© 2025 TimeWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
