"use client"

import { useEffect, useState } from "react"
import { Users, UserCheck, UserX, Clock, Calendar, TrendingUp } from "lucide-react"
import { getLocalTimeString, getLocalDateString } from "@/lib/utils/date"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionStatusCard } from "@/components/subscription-status-card"
import { TrialExpirationBanner } from "@/components/subscription/trial-expiration-banner"
import Link from "next/link"

interface DashboardStats {
  totalStaff: number
  presentToday: number
  currentlyPresent: number
  lateToday: number
  absentToday: number
  earlyDepartureToday: number
}

interface StaffPresent {
  staffId: string
  name: string
  department: string
  checkInTime: string
  isLate: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<StaffPresent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setStats(data.stats)
      setRecentActivity((data.currentStaff || []).slice(0, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return getLocalTimeString(new Date(timestamp))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trial Expiration Banner */}
      <TrialExpirationBanner />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {getLocalDateString(new Date())}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            {getLocalTimeString(new Date())}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalStaff || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Link href="/dashboard/present">
          <Card className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Present Today</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.presentToday || 0}</div>
              <p className="text-sm text-gray-500 mt-1">
                {stats?.totalStaff ? Math.round(((stats.presentToday || 0) / stats.totalStaff) * 100) : 0}% attendance
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/late">
          <Card className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Late Arrivals</CardTitle>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.lateToday || 0}</div>
              <p className="text-sm text-gray-500 mt-1">After scheduled time</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/absent">
          <Card className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Absent</CardTitle>
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.absentToday || 0}</div>
              <p className="text-sm text-gray-500 mt-1">Not checked in yet</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/present">
          <Card className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Currently In</CardTitle>
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats?.currentlyPresent || 0}</div>
              <p className="text-sm text-gray-500 mt-1">In workplace now</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/early">
          <Card className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Early Departures</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.earlyDepartureToday || 0}</div>
              <p className="text-sm text-gray-500 mt-1">Left before time</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Check-Ins</CardTitle>
          <CardDescription>Latest staff arrivals today</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No check-ins yet today</p>
              <p className="text-sm mt-1">Staff check-ins will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((staff) => (
                <div
                  key={staff.staffId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-500">{staff.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatTime(staff.checkInTime)}</div>
                    {staff.isLate && (
                      <div className="text-xs text-orange-600 font-medium mt-1">Late</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/staff">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg text-gray-900">Manage Staff</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Add, edit, or view all staff members</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/history">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <Clock className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg text-gray-900">View History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Check attendance records by date</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-lg text-gray-900">Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View insights and trends</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
