"use client"

/**
 * Payment Callback Page
 * Handles redirect from Paystack after payment
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function PaymentCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying")
  const [message, setMessage] = useState("Verifying your payment...")
  const [plan, setPlan] = useState<string>("")

  useEffect(() => {
    if (!reference) {
      setStatus("failed")
      setMessage("No payment reference found")
      return
    }

    verifyPayment()
  }, [reference])

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem("accessToken")

      if (!token) {
        setStatus("failed")
        setMessage("Authentication required. Please log in.")
        return
      }

      const response = await fetch(`/api/payment/verify?reference=${reference}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Payment successful! Your subscription has been upgraded.")
        setPlan(data.plan)

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard?upgraded=true")
        }, 3000)
      } else {
        setStatus("failed")
        setMessage(data.error || "Payment verification failed")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      setStatus("failed")
      setMessage("An error occurred while verifying your payment")
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TimeWise</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Verifying State */}
            {status === "verifying" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verifying Payment
                </h2>
                <p className="text-gray-600">{message}</p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 mb-4">{message}</p>
                {plan && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg mb-6">
                    <span className="text-sm font-medium text-blue-600">
                      Upgraded to {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-6">
                  Redirecting to dashboard...
                </p>
                <Link href="/dashboard">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {/* Failed State */}
            {status === "failed" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <Link href="/pricing">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="mailto:support@timewise.com" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
