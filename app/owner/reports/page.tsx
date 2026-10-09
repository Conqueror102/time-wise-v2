"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, FileText, TrendingUp, Building2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleGenerateReport = async () => {
    if (!reportType) {
      alert("Please select a report type")
      return
    }

    setGenerating(true)

    try {
      // Build query parameters
      const params = new URLSearchParams({
        type: reportType,
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
      })

      const token = localStorage.getItem("super_admin_token")
      const response = await fetch(`/api/owner/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to generate report")
      }

      const filename =
        response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `${reportType}-report.csv`
      const url = window.URL.createObjectURL(await response.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to generate report:", error)
      alert(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const reportTypes = [
    {
      id: "organizations",
      title: "Organizations Report",
      description: "Organizations, status and staff counts",
      icon: Building2,
    },
    {
      id: "users",
      title: "Users Report",
      description: "User registrations and activity",
      icon: Users,
    },
    {
      id: "attendance",
      title: "Attendance Report",
      description: "Check-ins and attendance patterns",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate and download platform reports
        </p>
      </div>

      {/* Report Types */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              reportType === report.id ? "ring-2 ring-purple-600" : ""
            }`}
            onClick={() => setReportType(report.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-100 p-3">
                  <report.icon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Optionally limit the report to a date range, then download it as CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={!reportType || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}
