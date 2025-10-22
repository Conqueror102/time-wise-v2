"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/owner/shared/StatCard"
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  DashboardStats,
  RevenueData,
  OrgGrowthData,
  SubscriptionData,
  PaymentRateData,
} from "@/lib/types/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/owner/dashboard/RevenueChart"
import { OrgGrowthChart } from "@/components/owner/dashboard/OrgGrowthChart"
import { SubscriptionPieChart } from "@/components/owner/dashboard/SubscriptionPieChart"
import { PaymentDonutChart } from "@/components/owner/dashboard/PaymentDonutChart"

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [orgGrowthData, setOrgGrowthData] = useState<OrgGrowthData[]>([])
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([])
  const [paymentRateData, setPaymentRateData] = useState<PaymentRateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    fetchChartData()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/owner/analytics/overview")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const [revenueRes, growthRes, distributionRes] = await Promise.all([
        fetch("/api/owner/analytics/revenue?period=month"),
        fetch("/api/owner/analytics/growth"),
        fetch("/api/owner/analytics/distribution"),
      ])

      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenueData(data)
      }

      if (growthRes.ok) {
        const data = await growthRes.json()
        setOrgGrowthData(data)
      }

      if (distributionRes.ok) {
        const data = await distributionRes.json()
        setSubscriptionData(data.subscriptionDistribution)
        setPaymentRateData(data.paymentSuccessRate)
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error)
    } finally {
      setChartsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your platform's performance and key metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organizations"
          value={stats?.totalOrganizations || 0}
          icon={Building2}
          loading={loading}
          iconColor="text-blue-600"
          description="Active tenants on platform"
        />
        <StatCard
          title="Active Users"
          value={stats?.totalActiveUsers || 0}
          icon={Users}
          loading={loading}
          iconColor="text-green-600"
          description="Users actively using system"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.totalActiveSubscriptions || 0}
          icon={CreditCard}
          loading={loading}
          iconColor="text-purple-600"
          description="Paying organizations"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${stats?.totalRevenue.toLocaleString() || 0}`}
          icon={DollarSign}
          loading={loading}
          iconColor="text-emerald-600"
          description="Lifetime revenue"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`₦${stats?.mrr.toLocaleString() || 0}`}
          icon={TrendingUp}
          loading={loading}
          iconColor="text-indigo-600"
          description="Expected monthly income"
        />
        <StatCard
          title="Active Tenants"
          value={stats?.activeTenants || 0}
          icon={CheckCircle2}
          loading={loading}
          iconColor="text-green-600"
          description="Organizations in good standing"
        />
        <StatCard
          title="Suspended Tenants"
          value={stats?.suspendedTenants || 0}
          icon={XCircle}
          loading={loading}
          iconColor="text-red-600"
          description="Organizations on hold"
        />
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData} loading={chartsLoading} />
        <OrgGrowthChart data={orgGrowthData} loading={chartsLoading} />
      </div>

      {/* Additional charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionPieChart data={subscriptionData} loading={chartsLoading} />
        <PaymentDonutChart data={paymentRateData} loading={chartsLoading} />
      </div>

      {/* Additional metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Check-ins Today</span>
              <span className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats?.dailyCheckins || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
