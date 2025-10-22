"use client"

import { useEffect, useState } from "react"
import { Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StaffPresent {
  staffId: string
  name: string
  department: string
  checkInTime: string
  isLate: boolean
}

export default function LatePage() {
  const [lateStaff, setLateStaff] = useState<StaffPresent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLateStaff()
  }, [])

  const fetchLateStaff = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch data")

      const data = await response.json()
      const late = (data.currentStaff || []).filter((s: StaffPresent) => s.isLate)
      setLateStaff(late)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Late Arrivals</h1>
        <p className="text-gray-600 mt-1">Staff who checked in after scheduled time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Late Today ({lateStaff.length})</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lateStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No late arrivals today!</p>
              <p className="text-sm mt-1">Everyone arrived on time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lateStaff.map((staff) => (
                <div
                  key={staff.staffId}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div>
                    <div className="font-medium text-gray-900">{staff.name}</div>
                    <div className="text-sm text-gray-500">{staff.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {formatTime(staff.checkInTime)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="w-3 h-3" />
                      Late
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
