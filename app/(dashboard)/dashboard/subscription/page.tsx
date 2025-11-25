"use client"

/**
 * Subscription Management Page
 * Dedicated page for managing subscriptions
 */

import { SubscriptionManager } from "@/components/subscription/subscription-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Shield, Zap } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-1">Manage your plan, billing, and subscription settings</p>
      </div>

      {/* Subscription Manager */}
      <SubscriptionManager />

      {/* Benefits Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-blue-600" />
              Flexible Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Upgrade or downgrade anytime. Changes take effect at the end of your billing period.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-green-600" />
              Secure Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              All payments are processed securely through Paystack with industry-standard encryption.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
              No Hidden Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Transparent pricing with no setup fees or hidden charges. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
