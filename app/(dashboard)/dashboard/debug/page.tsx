"use client"

/**
 * Debug Page - Shows database information
 * ONLY FOR DEVELOPMENT
 */

import { useEffect, useState } from "react"
import { AlertCircle, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/debug/organizations")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch debug data")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || "Failed to load debug data")
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

  if (error) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>
          <p className="text-gray-600 mt-1">Database contents (Development only)</p>
        </div>
        <Button onClick={fetchDebugData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Organizations ({data?.count || 0})
          </CardTitle>
          <CardDescription>All registered organizations in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.organizations?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No organizations found</p>
          ) : (
            <div className="space-y-4">
              {data?.organizations?.map((org: any) => (
                <div key={org.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{org.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      org.status === "active" ? "bg-green-100 text-green-700" :
                      org.status === "trial" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {org.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">ID:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {org.id}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Subdomain:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {org.subdomain}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Admin Email:</span>
                      <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-medium">
                        {org.adminEmail}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Tier:</span>
                      <span className="ml-2">{org.subscriptionTier}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Check-In Passcode:</span>
                      <code className="ml-2 bg-yellow-100 px-2 py-1 rounded text-xs font-medium">
                        {org.checkInPasscode}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({data?.users?.length || 0})</CardTitle>
          <CardDescription>All registered users in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.users?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {data?.users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email} • {user.role}
                    </div>
                  </div>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {user.tenantId}
                  </code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Use This Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>For Check-In Page:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use the <strong>Admin Email</strong> shown above</li>
            <li>Use the <strong>Check-In Passcode</strong> (or "1234" if "Not set")</li>
            <li>Go to /checkin and enter these credentials</li>
          </ul>
          <p className="mt-4">
            <strong>If "Not set":</strong> Go to Settings and set a passcode, or use "1234" in development mode.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
