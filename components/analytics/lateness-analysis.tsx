"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Doughnut, Bar } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Clock, AlertTriangle, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

ChartJS.register(ArcElement, Tooltip, Legend)

interface LatenessAnalysisProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
}

export function LatenessAnalysis({ timeRange }: LatenessAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatenessData()
  }, [timeRange])

  const fetchLatenessData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/lateness?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch lateness data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const latenessDistribution = {
    labels: ["0-15 min", "15-30 min", "30-60 min", "60+ min"],
    datasets: [
      {
        data: data?.distribution || [0, 0, 0, 0],
        backgroundColor: ["#fbbf24", "#f59e0b", "#f97316", "#ef4444"],
        borderWidth: 0,
      },
    ],
  }

  const topLateStaff = {
    labels: data?.topLateStaff?.map((s: any) => s.name) || [],
    datasets: [
      {
        label: "Late Arrivals",
        data: data?.topLateStaff?.map((s: any) => s.count) || [],
        backgroundColor: "#f59e0b",
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        cornerRadius: 8,
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Late Arrivals</p>
                <p className="text-3xl font-bold text-gray-900">{data?.totalLate || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {data?.latePercentage || 0}% of total attendance
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Delay</p>
                <p className="text-3xl font-bold text-gray-900">{data?.averageDelay || 0} min</p>
                <p className="text-sm text-gray-500 mt-1">Per late arrival</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Trend</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.trend > 0 ? "+" : ""}{data?.trend || 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">vs last period</p>
              </div>
              <div className={`p-3 rounded-lg ${data?.trend > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <TrendingUp className={`w-6 h-6 ${data?.trend > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Lateness Distribution</CardTitle>
            <CardDescription>Breakdown by delay duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={latenessDistribution} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Top Late Staff</CardTitle>
            <CardDescription>Staff with most late arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={topLateStaff} options={barOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Late Arrivals</CardTitle>
          <CardDescription>Latest instances of late check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Staff Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expected</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actual</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Delay</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLate?.map((record: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{record.staffName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.department}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.expectedTime}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.actualTime}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        +{record.delay} min
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
