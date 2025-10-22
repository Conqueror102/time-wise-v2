"use client"

/**
 * Attendance Logs Page
 */

import { useEffect, useState } from "react"
import { Calendar, Download, Filter, Clock, CheckCircle, XCircle, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getImageSrc } from "@/lib/utils/image"

interface AttendanceLog {
  _id: string
  staffId: string
  staffName: string
  department: string
  type: "check-in" | "check-out"
  status?: "present" | "late" | "early" | "absent"
  timestamp: string
  date: string
  isLate?: boolean
  isEarly?: boolean
  method: string
  checkInPhoto?: string
  checkOutPhoto?: string
  photosCapturedAt?: string
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [selectedPhoto, setSelectedPhoto] = useState<{
    photo: string
    staffName: string
    type: "check-in" | "check-out"
    timestamp: string
  } | null>(null)
  const [filters, setFilters] = useState({
    status: "all", // all, present, late, early, absent
    type: "all", // all, check-in, check-out
    method: "all", // all, manual, qr, fingerprint, face
    currentlyIn: "all" // all, in, out
  })

  useEffect(() => {
    fetchLogs()
  }, [selectedDate])

  useEffect(() => {
    applyFilters()
  }, [filters, allLogs])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedPhoto])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(
        `/api/attendance?date=${selectedDate}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch attendance logs")
      }

      const data = await response.json()
      setAllLogs(data.logs || [])
      setLogs(data.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allLogs]

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(log => {
        if (filters.status === "present") return !log.isLate && !log.isEarly && log.status !== "absent"
        if (filters.status === "late") return log.isLate || log.status === "late"
        if (filters.status === "early") return log.isEarly || log.status === "early"
        if (filters.status === "absent") return log.status === "absent"
        return log.status === filters.status
      })
    }

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter(log => log.type === filters.type)
    }

    // Filter by method
    if (filters.method !== "all") {
      filtered = filtered.filter(log => log.method === filters.method)
    }

    // Filter by currently in/out status
    if (filters.currentlyIn !== "all") {
      const staffWithCheckOut = new Set(
        allLogs.filter(log => log.type === "check-out").map(log => log.staffId)
      )
      
      if (filters.currentlyIn === "in") {
        // Show staff who checked in but haven't checked out
        filtered = filtered.filter(log => 
          log.type === "check-in" && !staffWithCheckOut.has(log.staffId)
        )
      } else if (filters.currentlyIn === "out") {
        // Show staff who have checked out
        filtered = filtered.filter(log => 
          log.type === "check-out" || !allLogs.some(l => l.staffId === log.staffId && l.type === "check-in")
        )
      }
    }

    setLogs(filtered)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Staff ID", "Name", "Department", "Type", "Status", "Method"]
    const rows = logs.map((log) => [
      log.date,
      formatTime(log.timestamp),
      log.staffId,
      log.staffName,
      log.department,
      log.type,
      log.status || (log.isLate ? "Late" : log.isEarly ? "Early" : "On Time"),
      log.method,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${selectedDate}.csv`
    a.click()
  }

  // Calculate stats from filtered logs
  const checkIns = logs.filter((log) => log.type === "check-in")
  const checkOuts = logs.filter((log) => log.type === "check-out")
  const lateArrivals = logs.filter((log) => log.isLate || log.status === "late")
  const earlyDepartures = logs.filter((log) => log.isEarly || log.status === "early")
  const presentStaff = logs.filter((log) => log.type === "check-in" && !log.isLate && !log.isEarly)
  
  // Calculate currently in office (checked in but not checked out)
  const staffWithCheckOut = new Set(
    allLogs.filter(log => log.type === "check-out").map(log => log.staffId)
  )
  const currentlyIn = allLogs.filter(log => 
    log.type === "check-in" && !staffWithCheckOut.has(log.staffId)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Logs</h1>
          <p className="text-gray-600 mt-1">Track and export attendance records</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently In</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentlyIn.length}</div>
            <p className="text-xs text-muted-foreground">Staff in office</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-Ins</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{checkIns.length}</div>
            <p className="text-xs text-muted-foreground">Today's arrivals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-Outs</CardTitle>
            <XCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{checkOuts.length}</div>
            <p className="text-xs text-muted-foreground">Today's departures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lateArrivals.length}</div>
            <p className="text-xs text-muted-foreground">Late check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Early Departures</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{earlyDepartures.length}</div>
            <p className="text-xs text-muted-foreground">Early check-outs</p>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter attendance records by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="early">Early</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="check-in">Check-In</option>
                <option value="check-out">Check-Out</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                value={filters.method}
                onChange={(e) => setFilters({...filters, method: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="manual">Manual</option>
                <option value="qr">QR Code</option>
                <option value="fingerprint">Fingerprint</option>
                <option value="face">Face Recognition</option>
              </select>
            </div>

            {/* Currently In/Out Filter */}
            <div className="space-y-2">
              <Label htmlFor="currentlyIn">Currently</Label>
              <select
                id="currentlyIn"
                value={filters.currentlyIn}
                onChange={(e) => setFilters({...filters, currentlyIn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Staff</option>
                <option value="in">Currently In</option>
                <option value="out">Checked Out</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button 
              onClick={() => setFilters({status: "all", type: "all", method: "all", currentlyIn: "all"})}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {allLogs.length} records
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Showing {logs.length} records for {selectedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Staff ID</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatTime(log.timestamp)}</td>
                      <td className="py-3 px-4 font-mono text-sm">{log.staffId}</td>
                      <td className="py-3 px-4">{log.staffName}</td>
                      <td className="py-3 px-4">{log.department}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.type === "check-in"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === "late" || log.isLate
                              ? "bg-orange-100 text-orange-700"
                              : log.status === "early" || log.isEarly
                              ? "bg-purple-100 text-purple-700"
                              : log.status === "absent"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {log.status || 
                           (log.isLate ? "Late" : 
                            log.isEarly ? "Early" : 
                            "Present")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 capitalize">
                        {log.method}
                      </td>
                      <td className="py-3 px-4">
                        {(log.checkInPhoto || log.checkOutPhoto) ? (
                          <div className="flex gap-1">
                            {log.checkInPhoto && (
                              <div className="relative group">
                                <img
                                  src={getImageSrc(log.checkInPhoto)}
                                  alt="Check-in photo"
                                  className="w-10 h-10 rounded-lg object-cover cursor-pointer border-2 border-green-200 hover:border-green-400 transition-colors"
                                  onClick={() => setSelectedPhoto({
                                    photo: log.checkInPhoto!,
                                    staffName: log.staffName,
                                    type: "check-in",
                                    timestamp: log.timestamp
                                  })}
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  ↓
                                </div>
                              </div>
                            )}
                            {log.checkOutPhoto && (
                              <div className="relative group">
                                <img
                                  src={getImageSrc(log.checkOutPhoto)}
                                  alt="Check-out photo"
                                  className="w-10 h-10 rounded-lg object-cover cursor-pointer border-2 border-blue-200 hover:border-blue-400 transition-colors"
                                  onClick={() => setSelectedPhoto({
                                    photo: log.checkOutPhoto!,
                                    staffName: log.staffName,
                                    type: "check-out",
                                    timestamp: log.timestamp
                                  })}
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                  ↑
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Camera className="w-3 h-3" />
                            <span>No photo</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed height */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {selectedPhoto.type === "check-in" ? "Check-In" : "Check-Out"} Photo
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {selectedPhoto.staffName} • {formatTime(selectedPhoto.timestamp)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            {/* Modal Body - Flexible height */}
            <div className="flex-1 p-2 sm:p-4 flex justify-center items-center min-h-0">
              <img
                src={getImageSrc(selectedPhoto.photo)}
                alt={`${selectedPhoto.type} photo`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
            
            {/* Modal Footer - Fixed height */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedPhoto.type === "check-in" ? "bg-green-500" : "bg-blue-500"
                }`}></div>
                <span className="text-sm text-gray-600">
                  {selectedPhoto.type === "check-in" ? "Arrival" : "Departure"} verification
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    // Create download link
                    const link = document.createElement('a')
                    link.href = getImageSrc(selectedPhoto.photo)
                    link.download = `${selectedPhoto.staffName}-${selectedPhoto.type}-${new Date(selectedPhoto.timestamp).toISOString().slice(0,10)}.jpg`
                    link.click()
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={() => setSelectedPhoto(null)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
