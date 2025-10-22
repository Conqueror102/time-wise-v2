"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, Column } from "@/components/owner/shared/DataTable"
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  ArrowLeft,
  MoreVertical,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/owner/shared/StatCard"

interface OrganizationDetails {
  _id: string
  name: string
  subdomain: string
  adminEmail: string
  subscriptionTier: string
  status: string
  trialEnds?: string
  createdAt: string
  analytics: {
    totalStaff: number
    activeStaff: number
    totalCheckins: number
    averageAttendanceRate: number
  }
  users: Array<{
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
  }>
}

export default function OrganizationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [org, setOrg] = useState<OrganizationDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchOrganizationDetails()
    }
  }, [id])

  const fetchOrganizationDetails = async () => {
    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch(`/api/owner/organizations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrg(data)
      }
    } catch (error) {
      console.error("Failed to fetch organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this organization?")) return

    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch(`/api/owner/organizations/${id}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchOrganizationDetails()
      }
    } catch (error) {
      console.error("Failed to suspend organization:", error)
    }
  }

  const handleActivate = async () => {
    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch(`/api/owner/organizations/${id}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchOrganizationDetails()
      }
    } catch (error) {
      console.error("Failed to activate organization:", error)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this organization? This action cannot be undone!"
      )
    )
      return

    try {
      const token = localStorage.getItem("super_admin_token")
      const response = await fetch(`/api/owner/organizations/${id}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.push("/owner/organizations")
      }
    } catch (error) {
      console.error("Failed to delete organization:", error)
    }
  }

  const userColumns: Column<any>[] = [
    {
      header: "Name",
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (row) => (
        <Badge variant={row.role === "admin" ? "default" : "secondary"}>
          {row.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "destructive"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Organization not found</p>
        <Button onClick={() => router.push("/owner/organizations")} className="mt-4">
          Back to Organizations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/owner/organizations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {org.subdomain} • Created {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVertical className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {org.status === "active" ? (
              <DropdownMenuItem onClick={handleSuspend}>
                <Ban className="mr-2 h-4 w-4" />
                Suspend Organization
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleActivate}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Organization
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Update Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge
                  variant={org.status === "active" ? "default" : "destructive"}
                  className="mt-2"
                >
                  {org.status.toUpperCase()}
                </Badge>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-2xl font-bold mt-1">
                  {org.subscriptionTier.toUpperCase()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Email</p>
                <p className="text-sm font-medium mt-1 truncate">
                  {org.adminEmail}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trial Ends</p>
                <p className="text-sm font-medium mt-1">
                  {org.trialEnds
                    ? new Date(org.trialEnds).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Staff"
          value={org.analytics.totalStaff}
          icon={Users}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Staff"
          value={org.analytics.activeStaff}
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Check-ins"
          value={org.analytics.totalCheckins}
          icon={Activity}
          iconColor="text-purple-600"
        />
        <StatCard
          title="Attendance Rate"
          value={`${org.analytics.averageAttendanceRate.toFixed(1)}%`}
          icon={CreditCard}
          iconColor="text-emerald-600"
        />
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={org.users}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  )
}
