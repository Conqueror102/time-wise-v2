"use client"

import { useState } from "react"
import { getUTCDateString } from "@/lib/utils/date"
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
import { Download, FileText, TrendingUp, Building2, Users, CreditCard } from "lucide-react"
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

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create CSV content (example)
      const csvContent = generateCSVContent(reportType)

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-report-${getUTCDateString()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to generate report:", error)
      alert("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const generateCSVContent = (type: string) => {
    switch (type) {
      case "revenue":
        return `Date,Amount,Currency,Organization,Plan\n2025-01-01,50000,NGN,ABC Company,Pro\n2025-01-02,30000,NGN,XYZ Corp,Basic\n`
      case "organizations":
        return `Name,Subdomain,Plan,Status,Created At\nABC Company,abc,pro,active,2025-01-01\nXYZ Corp,xyz,basic,active,2025-01-02\n`
      case "users":
        return `Name,Email,Organization,Role,Status\nJohn Doe,john@example.com,ABC Company,admin,active\nJane Smith,jane@example.com,XYZ Corp,staff,active\n`
      case "attendance":
        return `Date,Organization,Total Check-ins,Late Arrivals,On Time\n2025-01-01,ABC Company,45,5,40\n2025-01-02,XYZ Corp,30,3,27\n`
      default:
        return "Report data\n"
    }
  }

  const reportTypes = [
    {
      id: "revenue",
      title: "Revenue Report",
      description: "Financial performance and payment transactions",
      icon: CreditCard,
    },
    {
      id: "organizations",
      title: "Organizations Report",
      description: "Growth and subscription metrics",
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            Select date range and format to generate your report
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

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select defaultValue="csv">
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                <SelectItem value="excel" disabled>Excel (Coming Soon)</SelectItem>
                <SelectItem value="pdf" disabled>PDF (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: "Revenue Report - January 2025",
                date: "2025-01-20",
                size: "2.4 MB",
              },
              {
                name: "Organizations Report - Q4 2024",
                date: "2024-12-31",
                size: "1.8 MB",
              },
              {
                name: "Attendance Report - December 2024",
                date: "2024-12-30",
                size: "3.1 MB",
              },
            ].map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Generated on {new Date(report.date).toLocaleDateString()} • {report.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
