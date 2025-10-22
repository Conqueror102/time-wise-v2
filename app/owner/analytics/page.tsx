"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/owner/shared/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Camera,
  TrendingUp,
} from "lucide-react"

interface SystemAnalytics {
  todayCheckins: number
  todayLateArrivals: number
  totalAttendanceLogs: number
  staffRatio: {
    active: number
    inactive: number
    total: number
    activePercentage: number
  }
  photoVerificationRate: number
  mostActiveTenants: Array<{
    organizationId: string
    organizationName: string
    totalCheckins: number
    activeUsers: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/owner/analytics/system")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Platform-wide attendance and usage metrics
        </p>
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Today's Activity
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Check-ins Today"
            value={analytics?.todayCheckins || 0}
            icon={CheckCircle2}
            loading={loading}
            iconColor="text-green-600"
            description="Total check-ins across all organizations"
          />
          <StatCard
            title="Late Arrivals Today"
            value={analytics?.todayLateArrivals || 0}
            icon={Clock}
            loading={loading}
            iconColor="text-orange-600"
            description="Staff who arrived late"
          />
          <StatCard
            title="Total Attendance Logs"
            value={analytics?.totalAttendanceLogs.toLocaleString() || 0}
            icon={FileText}
            loading={loading}
            iconColor="text-blue-600"
            description="All-time attendance records"
          />
        </div>
      </div>

      {/* Staff Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Staff Metrics
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Staff"
            value={analytics?.staffRatio.active || 0}
            icon={Users}
            loading={loading}
            iconColor="text-green-600"
            description={`${analytics?.staffRatio.activePercentage.toFixed(1)}% of total staff`}
          />
          <StatCard
            title="Inactive Staff"
            value={analytics?.staffRatio.inactive || 0}
            icon={Users}
            loading={loading}
            iconColor="text-gray-600"
            description="Currently inactive"
          />
          <StatCard
            title="Photo Verification Rate"
            value={`${analytics?.photoVerificationRate.toFixed(1)}%`}
            icon={Camera}
            loading={loading}
            iconColor="text-purple-600"
            description="Check-ins with photo verification"
          />
        </div>
      </div>

      {/* Most Active Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Most Active Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.mostActiveTenants.map((tenant, index) => (
                <div
                  key={tenant.organizationId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {tenant.organizationName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tenant.activeUsers} active users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {tenant.totalCheckins.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">total check-ins</p>
                  </div>
                </div>
              ))}

              {!analytics?.mostActiveTenants?.length && (
                <p className="text-center text-gray-500 py-8">
                  No activity data available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Ratio Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Active Staff</span>
                <span className="font-semibold text-green-600">
                  {analytics?.staffRatio.active || 0} (
                  {analytics?.staffRatio.activePercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${analytics?.staffRatio.activePercentage || 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">
                  Inactive Staff
                </span>
                <span className="font-semibold text-gray-600">
                  {analytics?.staffRatio.inactive || 0} (
                  {(
                    100 - (analytics?.staffRatio.activePercentage || 0)
                  ).toFixed(1)}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${100 - (analytics?.staffRatio.activePercentage || 0)}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total Staff</span>
                <span className="font-bold text-purple-600 text-lg">
                  {analytics?.staffRatio.total || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
