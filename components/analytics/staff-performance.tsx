"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Download, Award, AlertCircle, CheckCircle } from "lucide-react"

interface StaffPerformanceProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
}

export function StaffPerformance({ timeRange }: StaffPerformanceProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchStaffData()
  }, [timeRange])

  const fetchStaffData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/staff?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch staff data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = data?.staff?.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Best Attendance</p>
                <p className="text-xl font-bold text-gray-900">{data?.topPerformers?.attendance?.name}</p>
                <p className="text-sm text-gray-600">{data?.topPerformers?.attendance?.staffId}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-600">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data?.topPerformers?.attendance?.attendanceRate || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {data?.topPerformers?.attendance?.attendanceRate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Most Punctual</p>
                <p className="text-xl font-bold text-gray-900">{data?.topPerformers?.punctual?.name}</p>
                <p className="text-sm text-gray-600">{data?.topPerformers?.punctual?.staffId}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-600">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${data?.topPerformers?.punctual?.punctualityScore || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-green-600">
                {data?.topPerformers?.punctual?.punctualityScore || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Needs Attention</p>
                <p className="text-xl font-bold text-gray-900">{data?.needsAttention?.name}</p>
                <p className="text-sm text-gray-600">{data?.needsAttention?.staffId}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-600">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-orange-600 font-medium">
              {data?.needsAttention?.lateCount} late arrivals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-gray-900">Staff Performance</CardTitle>
              <CardDescription>Individual attendance and punctuality metrics</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Staff ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Attendance</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Punctuality</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Late Count</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff?.map((staff: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{staff.staffId}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{staff.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{staff.department}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              staff.attendanceRate >= 90 ? 'bg-green-600' :
                              staff.attendanceRate >= 75 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${staff.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-10">
                          {staff.attendanceRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {staff.attendanceRate === 0 ? (
                        <span className="text-sm text-gray-400 font-medium">N/A</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                staff.punctualityScore >= 90 ? 'bg-green-600' :
                                staff.punctualityScore >= 75 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${staff.punctualityScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-10">
                            {staff.punctualityScore}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.lateCount === 0 ? 'bg-green-100 text-green-800' :
                        staff.lateCount <= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {staff.lateCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                        staff.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                        staff.status === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        staff.status === 'Absent' ? 'bg-gray-100 text-gray-800' :
                        staff.status === 'Very Poor' ? 'bg-red-200 text-red-900' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {staff.status}
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
