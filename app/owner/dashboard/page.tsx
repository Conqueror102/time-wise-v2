"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/owner/shared/StatCard"
import {
  Building2,
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { DashboardStats, OrgGrowthData } from "@/lib/types/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrgGrowthChart } from "@/components/owner/dashboard/OrgGrowthChart"

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orgGrowthData, setOrgGrowthData] = useState<OrgGrowthData[]>([])
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    fetchChartData()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch("/api/owner/analytics/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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
      const token = localStorage.getItem("super_admin_token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const growthRes = await fetch("/api/owner/analytics/growth", { headers })

      if (growthRes.ok) {
        const data = await growthRes.json()
        setOrgGrowthData(data)
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
          title="Active Staff"
          value={stats?.totalStaff || 0}
          icon={UserCheck}
          loading={loading}
          iconColor="text-purple-600"
          description="Staff across all organizations"
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
      <OrgGrowthChart data={orgGrowthData} loading={chartsLoading} />

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
