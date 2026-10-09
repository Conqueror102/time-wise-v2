"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Database, Mail, Activity, MinusCircle } from "lucide-react"

interface HealthStatus {
  service: string
  status: "healthy" | "degraded" | "down" | "not_configured"
  responseTime?: number
  lastChecked: string
  message?: string
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchHealthData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchHealthData = async () => {
    setRefreshing(true)
    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch("/api/owner/health", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to check system health")
      setHealthData(data.services)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check system health")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "down":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "not_configured":
        return <MinusCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "degraded":
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
      case "down":
        return <Badge variant="destructive">Down</Badge>
      case "not_configured":
        return <Badge variant="secondary">Not configured</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getServiceIcon = (service: string) => {
    if (service.includes("MongoDB")) return <Database className="h-6 w-6" />
    if (service.includes("Email")) return <Mail className="h-6 w-6" />
    return <Activity className="h-6 w-6" />
  }

  // Unconfigured optional services are not failures
  const allHealthy = !error && healthData.every((h) => h.status === "healthy" || h.status === "not_configured")

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor platform services and infrastructure
          </p>
        </div>
        <Button
          onClick={fetchHealthData}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={allHealthy ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {allHealthy ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {allHealthy ? "All Systems Operational" : "Some Issues Detected"}
              </h3>
              <p className="text-sm text-gray-600">
                {error
                  ? error
                  : allHealthy
                    ? "Every configured service is responding"
                    : "Some services are experiencing issues"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {healthData.map((health, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-gray-600">
                      {getServiceIcon(health.service)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {health.service}
                        </h3>
                        {getStatusBadge(health.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {health.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {health.responseTime !== undefined && health.responseTime > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="font-semibold text-gray-900">
                          {health.responseTime}ms
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Last Checked</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(health.lastChecked).toLocaleTimeString()}
                      </p>
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
