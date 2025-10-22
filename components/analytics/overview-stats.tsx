"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface OverviewStatsProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
}

interface Stats {
  totalStaff: number
  totalAttendance: number
  averageAttendanceRate: number
  lateArrivals: number
  earlyDepartures: number
  absentees: number
  trends: {
    attendance: number
    lateness: number
  }
}

export function OverviewStats({ timeRange }: OverviewStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/overview?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Staff",
      value: stats?.totalStaff || 0,
      icon: Users,
      color: "bg-blue-600",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50",
    },
    {
      title: "Attendance Rate",
      value: `${stats?.averageAttendanceRate || 0}%`,
      icon: UserCheck,
      color: "bg-green-600",
      textColor: "text-green-600",
      bgLight: "bg-green-50",
      trend: stats?.trends?.attendance,
    },
    {
      title: "Late Arrivals",
      value: stats?.lateArrivals || 0,
      icon: Clock,
      color: "bg-orange-600",
      textColor: "text-orange-600",
      bgLight: "bg-orange-50",
      trend: stats?.trends?.lateness,
    },
    {
      title: "Absentees",
      value: stats?.absentees || 0,
      icon: UserX,
      color: "bg-red-600",
      textColor: "text-red-600",
      bgLight: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                
                {stat.trend !== undefined && (
                  <div className="flex items-center gap-1">
                    {stat.trend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(stat.trend)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                )}
              </div>
              
              <div className={`p-3 rounded-lg ${stat.bgLight}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
