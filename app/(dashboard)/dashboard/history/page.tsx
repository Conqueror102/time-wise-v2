"use client"

import { useEffect, useState } from "react"
import { getImageSrc } from "@/lib/utils/image"
import { Calendar, Filter, Download, Search, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Staff {
  staffId: string
  name: string
  department: string
}

interface AttendanceRecord {
  staffId: string
  staffName: string
  department: string
  checkInTime: string
  checkOutTime?: string
  isLate: boolean
  isEarly: boolean
  date: string
}

export default function HistoryPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [filteredHistory, setFilteredHistory] = useState<AttendanceRecord[]>([])
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [attendanceHistory, selectedStaff, statusFilter, searchTerm])

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch staff")

      const data = await response.json()
      setStaff(data.staff || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAttendanceHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedStaff !== "all" && { staffId: selectedStaff }),
      })

      const response = await fetch(`/api/attendance/history?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch history")

      const data = await response.json()
      setAttendanceHistory(data.attendance || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...attendanceHistory]

    // Filter by staff
    if (selectedStaff !== "all") {
      filtered = filtered.filter((record) => record.staffId === selectedStaff)
    }

    // Filter by status
    if (statusFilter === "late") {
      filtered = filtered.filter((record) => record.isLate)
    } else if (statusFilter === "ontime") {
      filtered = filtered.filter((record) => !record.isLate)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredHistory(filtered)
  }

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      alert("No data to export")
      return
    }

    const headers = ["Date", "Staff ID", "Staff Name", "Department", "Check In", "Check Out", "Late", "Early Departure"]
    const rows = filteredHistory.map((record) => [
      record.date,
      record.staffId,
      record.staffName,
      record.department,
      formatTime(record.checkInTime),
      record.checkOutTime ? formatTime(record.checkOutTime) : "N/A",
      record.isLate ? "Yes" : "No",
      record.isEarly ? "Yes" : "No",
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `attendance_${selectedStaff !== "all" ? selectedStaff : "all"}_${startDate}_to_${endDate}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-600 mt-1">View and export staff attendance records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter attendance records by staff, date range, and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Staff Selection */}
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.staffId} value={s.staffId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ontime">On Time</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={fetchAttendanceHistory}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredHistory.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance Records ({filteredHistory.length})
          </CardTitle>
          <CardDescription>
            {selectedStaff !== "all"
              ? `Showing records for ${staff.find((s) => s.staffId === selectedStaff)?.name || "selected staff"}`
              : "Showing all staff records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No attendance records found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((record, idx) => (
                <div
                  key={`${record.staffId}-${record.date}-${idx}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{record.staffName}</div>
                      {record.isLate && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                          Late
                        </span>
                      )}
                      {record.isEarly && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                          Early Departure
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.staffId} • {record.department}
                    </div>
                    
                    {/* Photos */}
                    {((record as any).checkInPhoto || (record as any).checkOutPhoto) && (
                      <div className="flex gap-2 mt-2">
                        {(record as any).checkInPhoto && (
                          <img 
                            src={getImageSrc((record as any).checkInPhoto)}
                            alt="Check-in photo"
                            className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-green-200"
                            onClick={() => {
                              window.open(getImageSrc((record as any).checkInPhoto), '_blank')
                            }}
                            title="Check-in photo - Click to view full size"
                          />
                        )}
                        {(record as any).checkOutPhoto && (
                          <img 
                            src={getImageSrc((record as any).checkOutPhoto)}
                            alt="Check-out photo"
                            className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-blue-200"
                            onClick={() => {
                              window.open(getImageSrc((record as any).checkOutPhoto), '_blank')
                            }}
                            title="Check-out photo - Click to view full size"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">{formatDate(record.date)}</div>
                    <div className="text-sm text-gray-600">
                      In: {formatTime(record.checkInTime)}
                      {record.checkOutTime && ` • Out: ${formatTime(record.checkOutTime)}`}
                    </div>
                    {/* Show methods */}
                    <div className="text-xs text-gray-500 mt-1">
                      {(record as any).checkInMethod && `In: ${(record as any).checkInMethod}`}
                      {(record as any).checkOutMethod && ` • Out: ${(record as any).checkOutMethod}`}
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
