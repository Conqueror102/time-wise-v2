"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/owner/shared/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AuditLog {
  _id: string
  actorEmail: string
  actorRole: string
  tenantId?: string
  action: string
  metadata: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [page, search, actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(actionFilter && actionFilter !== "all" && { action: actionFilter }),
      })

      const response = await fetch(`/api/owner/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(actionFilter && actionFilter !== "all" && { action: actionFilter }),
      })

      const response = await fetch(`/api/owner/logs/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export logs:", error)
    } finally {
      setExporting(false)
    }
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: "bg-blue-100 text-blue-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      SUSPEND_TENANT: "bg-red-100 text-red-800",
      ACTIVATE_TENANT: "bg-green-100 text-green-800",
      DELETE_TENANT: "bg-red-100 text-red-800",
      UPGRADE_PLAN: "bg-purple-100 text-purple-800",
      DOWNGRADE_PLAN: "bg-orange-100 text-orange-800",
      DELETE_USER: "bg-red-100 text-red-800",
      SUSPEND_USER: "bg-yellow-100 text-yellow-800",
      RESET_PASSWORD: "bg-indigo-100 text-indigo-800",
      VIEW_REPORT: "bg-blue-100 text-blue-800",
      EXPORT_DATA: "bg-green-100 text-green-800",
    }

    return (
      <Badge className={colors[action] || "bg-gray-100 text-gray-800"}>
        {action}
      </Badge>
    )
  }

  const columns: Column<AuditLog>[] = [
    {
      header: "Timestamp",
      cell: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(row.timestamp).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            {new Date(row.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      header: "Actor",
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.actorEmail}</div>
          <div className="text-sm text-gray-500">{row.actorRole}</div>
        </div>
      ),
    },
    {
      header: "Action",
      cell: (row) => getActionBadge(row.action),
    },
    {
      header: "Details",
      cell: (row) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {JSON.stringify(row.metadata)}
        </div>
      ),
    },
    {
      header: "IP Address",
      cell: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {row.ipAddress}
        </span>
      ),
    },
  ]

  const actionTypes = [
    "LOGIN",
    "LOGOUT",
    "SUSPEND_TENANT",
    "ACTIVATE_TENANT",
    "DELETE_TENANT",
    "UPGRADE_PLAN",
    "DOWNGRADE_PLAN",
    "DELETE_USER",
    "SUSPEND_USER",
    "RESET_PASSWORD",
    "VIEW_REPORT",
    "EXPORT_DATA",
    "VIEW_ORGANIZATIONS",
    "VIEW_USERS",
    "VIEW_PAYMENTS",
    "VIEW_ANALYTICS",
    "VIEW_LOGS",
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track all administrative actions on the platform
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by actor, action, or tenant..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Select
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                pagination={{
                  page,
                  totalPages,
                  onPageChange: setPage,
                }}
                emptyMessage="No audit logs found"
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent actions sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-gray-500">{log.actorEmail}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
