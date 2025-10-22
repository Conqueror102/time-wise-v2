"use client"

import { useEffect, useState } from "react"
import { UserX, UserCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AbsentStaff {
  staffId: string
  name: string
  department: string
}

export default function AbsentPage() {
  const [absentStaff, setAbsentStaff] = useState<AbsentStaff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAbsentStaff()
  }, [])

  const fetchAbsentStaff = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch data")

      const data = await response.json()
      setAbsentStaff(data.absentStaff || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Absent Staff</h1>
        <p className="text-gray-600 mt-1">Staff members who haven't checked in today</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Absent Today ({absentStaff.length})</CardTitle>
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
          {absentStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCheck className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">All staff have checked in!</p>
              <p className="text-sm mt-1">100% attendance today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {absentStaff.map((staff) => (
                <div
                  key={staff.staffId}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
                >
                  <div>
                    <div className="font-medium text-gray-900">{staff.name}</div>
                    <div className="text-sm text-gray-500">
                      {staff.staffId} • {staff.department}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">Absent</span>
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
