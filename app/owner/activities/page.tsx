"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface Activity {
  id: string
  type: string
  title: string
  description: string
  metadata: Record<string, any>
  timestamp: string
  icon: string
  color: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchActivities()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    if (!loading) setRefreshing(true)
    try {
      const response = await fetch("/api/owner/activities")
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      building: Building2,
      user: Users,
      dollar: DollarSign,
      clock: Clock,
      trending: TrendingUp,
      check: CheckCircle2,
    }
    const Icon = icons[iconName] || Clock
    return Icon
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        blue: {
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200",
        },
        green: {
          bg: "bg-green-100",
          text: "text-green-600",
          border: "border-green-200",
        },
        emerald: {
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          border: "border-emerald-200",
        },
        purple: {
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
        },
        orange: {
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200",
        },
        red: {
          bg: "bg-red-100",
          text: "text-red-600",
          border: "border-red-200",
        },
      }
    return (
      colors[color] || {
        bg: "bg-gray-100",
        text: "text-gray-600",
        border: "border-gray-200",
      }
    )
  }

  const getActivityBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      organization_created: { label: "New Org", variant: "default" },
      user_created: { label: "New User", variant: "secondary" },
      payment_success: { label: "Payment", variant: "default" },
      checkin: { label: "Check-in", variant: "secondary" },
    }
    const badge = badges[type] || { label: type, variant: "outline" }
    return <Badge variant={badge.variant}>{badge.label}</Badge>
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) {
      return "Just now"
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }
    // More than 24 hours
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Activities
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time feed of platform events and user activities
          </p>
        </div>
        <Button
          onClick={fetchActivities}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Activity stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New Orgs</p>
                <p className="text-2xl font-bold">
                  {
                    activities.filter((a) => a.type === "organization_created")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New Users</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a) => a.type === "user_created").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payments</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a) => a.type === "payment_success").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-ins</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a) => a.type === "checkin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = getIcon(activity.icon)
                const colors = getColorClasses(activity.color)

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg} border ${colors.border}`}
                    >
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {activity.title}
                        </h3>
                        {getActivityBadge(activity.type)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      {activity.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(
                            ([key, value]) =>
                              typeof value === "string" ||
                              typeof value === "number" ? (
                                <span
                                  key={key}
                                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                                >
                                  {key}: {String(value)}
                                </span>
                              ) : null
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                )
              })}

              {activities.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No recent activities
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
