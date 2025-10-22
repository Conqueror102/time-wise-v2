"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, Radar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, TrendingUp, Clock } from "lucide-react"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface DepartmentBreakdownProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
}

export function DepartmentBreakdown({ timeRange }: DepartmentBreakdownProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartmentData()
  }, [timeRange])

  const fetchDepartmentData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/departments?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch department data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
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

  const attendanceByDept = {
    labels: data?.departments?.map((d: any) => d.name) || [],
    datasets: [
      {
        label: "Attendance Rate (%)",
        data: data?.departments?.map((d: any) => d.attendanceRate) || [],
        backgroundColor: "#2563eb",
      },
    ],
  }

  const radarData = {
    labels: data?.departments?.map((d: any) => d.name) || [],
    datasets: [
      {
        label: "Punctuality Score",
        data: data?.departments?.map((d: any) => d.punctualityScore) || [],
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        borderColor: "#2563eb",
        borderWidth: 2,
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
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "#f3f4f6",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.departments?.slice(0, 3).map((dept: any, index: number) => (
          <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{dept.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{dept.staffCount} Staff</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendance</span>
                  <span className="text-sm font-semibold text-gray-900">{dept.attendanceRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dept.attendanceRate}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">Punctuality</span>
                  <span className="text-sm font-semibold text-gray-900">{dept.punctualityScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dept.punctualityScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Attendance by Department</CardTitle>
            <CardDescription>Average attendance rate per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={attendanceByDept} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Punctuality Comparison</CardTitle>
            <CardDescription>Department punctuality scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Department Performance</CardTitle>
          <CardDescription>Comprehensive department metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Staff Count</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Attendance Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Punctuality</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Late Arrivals</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data?.departments?.map((dept: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{dept.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{dept.staffCount}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dept.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                        dept.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dept.punctualityScore >= 90 ? 'bg-green-100 text-green-800' :
                        dept.punctualityScore >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.punctualityScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{dept.lateCount}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center text-xs font-medium ${
                        dept.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dept.trend >= 0 ? '↑' : '↓'} {Math.abs(dept.trend)}%
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
