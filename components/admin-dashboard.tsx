"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, UserX, Settings, Download, Filter, AlertTriangle } from "lucide-react"
import type { AttendanceLog, Staff, AdminSettings } from "@/lib/models"

export function AdminDashboard() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [currentStaff, setCurrentStaff] = useState<AttendanceLog[]>([])
  const [absentStaff, setAbsentStaff] = useState<Staff[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ latenessTime: "09:00", workEndTime: "17:00" })
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "all",
    lateOnly: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLogs()
    fetchCurrentStaff()
    fetchAbsentStaff()
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append("date", filters.date)
      if (filters.department !== "all") params.append("department", filters.department)
      if (filters.lateOnly) params.append("lateOnly", "true")

      const response = await fetch(`/api/admin/logs?${params}`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentStaff = async () => {
    try {
      const response = await fetch("/api/admin/current-staff")
      const data = await response.json()
      setCurrentStaff(data.currentStaff || [])
    } catch (error) {
      console.error("Error fetching current staff:", error)
    }
  }

  const fetchAbsentStaff = async () => {
    try {
      const response = await fetch(`/api/admin/absent-staff?date=${filters.date}`)
      const data = await response.json()
      setAbsentStaff(data.absentStaff || [])
    } catch (error) {
      console.error("Error fetching absent staff:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      setSettings(data.settings || { latenessTime: "09:00", workEndTime: "17:00" })
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const updateSettings = async () => {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      alert("Settings updated successfully!")
    } catch (error) {
      console.error("Error updating settings:", error)
      alert("Failed to update settings")
    }
  }

  const exportToCSV = () => {
    const headers = ["Staff ID", "Name", "Department", "Type", "Date", "Time", "Late"]
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.staffId,
          log.staffName,
          log.department,
          log.type,
          log.date,
          new Date(log.timestamp).toLocaleTimeString(),
          log.isLate ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-logs-${filters.date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const departments = [
    "all",
    "Human Resources",
    "Engineering",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "Customer Support",
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStaff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {logs.filter((log) => log.date === filters.date && log.isLate).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentStaff.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Attendance Logs</TabsTrigger>
          <TabsTrigger value="current">Currently In</TabsTrigger>
          <TabsTrigger value="absent">Absent Staff</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="date">Date:</Label>
                <Input
                  id="date"
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="department">Department:</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lateOnly"
                  checked={filters.lateOnly}
                  onChange={(e) => setFilters({ ...filters, lateOnly: e.target.checked })}
                />
                <Label htmlFor="lateOnly">Late arrivals only</Label>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Logs</CardTitle>
              <CardDescription>{loading ? "Loading..." : `${logs.length} records found`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left">Staff ID</th>
                      <th className="border border-gray-200 p-2 text-left">Name</th>
                      <th className="border border-gray-200 p-2 text-left">Department</th>
                      <th className="border border-gray-200 p-2 text-left">Type</th>
                      <th className="border border-gray-200 p-2 text-left">Time</th>
                      <th className="border border-gray-200 p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 font-mono">{log.staffId}</td>
                        <td className="border border-gray-200 p-2">{log.staffName}</td>
                        <td className="border border-gray-200 p-2">{log.department}</td>
                        <td className="border border-gray-200 p-2">
                          <Badge variant={log.type === "check-in" ? "default" : "secondary"}>{log.type}</Badge>
                        </td>
                        <td className="border border-gray-200 p-2">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="border border-gray-200 p-2">
                          {log.isLate && (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Late
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Currently Clocked In</CardTitle>
              <CardDescription>{currentStaff.length} staff members currently in office</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentStaff.map((staff, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{staff.staffName}</p>
                      <p className="text-sm text-gray-600">
                        {staff.department} • {staff.staffId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Checked in at</p>
                      <p className="font-mono text-sm">{new Date(staff.timestamp).toLocaleTimeString()}</p>
                      {staff.isLate && (
                        <Badge variant="destructive" className="mt-1">
                          Late
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {currentStaff.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No staff currently clocked in</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absent">
          <Card>
            <CardHeader>
              <CardTitle>Absent Staff</CardTitle>
              <CardDescription>Staff who haven't checked in for {filters.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {absentStaff.map((staff, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-gray-600">
                        {staff.department} • {staff.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{staff.staffId}</p>
                      <Badge variant="destructive">Absent</Badge>
                    </div>
                  </div>
                ))}
                {absentStaff.length === 0 && (
                  <p className="text-center text-gray-500 py-8">All staff have checked in today!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                System Settings
              </CardTitle>
              <CardDescription>Configure lateness time and work hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latenessTime">Lateness Time</Label>
                  <Input
                    id="latenessTime"
                    type="time"
                    value={settings.latenessTime}
                    onChange={(e) => setSettings({ ...settings, latenessTime: e.target.value })}
                  />
                  <p className="text-sm text-gray-600">Check-ins after this time will be marked as late</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEndTime">Work End Time</Label>
                  <Input
                    id="workEndTime"
                    type="time"
                    value={settings.workEndTime}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  />
                  <p className="text-sm text-gray-600">Used to determine absent staff</p>
                </div>
              </div>
              <Button onClick={updateSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
