"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Skeleton } from "@/components/ui/skeleton"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AttendanceTrendsProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
  detailed?: boolean
}

export function AttendanceTrends({ timeRange, detailed = false }: AttendanceTrendsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [timeRange])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/trends?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch trends:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const lineChartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Check-ins",
        data: data?.checkIns || [],
        borderColor: "#2563eb", // Blue
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Check-outs",
        data: data?.checkOuts || [],
        borderColor: "#8b5cf6", // Purple
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const barChartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "On Time",
        data: data?.onTime || [],
        backgroundColor: "#10b981",
      },
      {
        label: "Late",
        data: data?.late || [],
        backgroundColor: "#f59e0b",
      },
      {
        label: "Absent",
        data: data?.absent || [],
        backgroundColor: "#ef4444",
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "600",
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Attendance Trends</CardTitle>
          <CardDescription>Daily check-in and check-out patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Punctuality Overview</CardTitle>
          <CardDescription>On-time vs late arrivals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {detailed && (
        <>
          <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-gray-900">Weekly Comparison</CardTitle>
              <CardDescription>Week-over-week attendance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={{
                    labels: data?.weeklyLabels || [],
                    datasets: [
                      {
                        label: "This Week",
                        data: data?.thisWeek || [],
                        backgroundColor: "#2563eb",
                      },
                      {
                        label: "Last Week",
                        data: data?.lastWeek || [],
                        backgroundColor: "#93c5fd",
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
