"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/owner/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Organization {
  _id: string
  name: string
  subdomain: string
  adminEmail: string
  subscriptionTier: string
  status: string
  createdAt: string
  trialEnds?: string
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrganizations()
  }, [page, search])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("super_admin_token")
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/owner/organizations?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
    }

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPlanBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      basic: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    }

    return (
      <Badge className={colors[tier] || "bg-gray-100 text-gray-800"}>
        {tier.toUpperCase()}
      </Badge>
    )
  }

  const columns: Column<Organization>[] = [
    {
      header: "Organization",
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.subdomain}</div>
        </div>
      ),
    },
    {
      header: "Admin Email",
      accessorKey: "adminEmail",
      cell: (row) => (
        <span className="text-sm text-gray-700">{row.adminEmail}</span>
      ),
    },
    {
      header: "Plan",
      cell: (row) => getPlanBadge(row.subscriptionTier),
    },
    {
      header: "Status",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/owner/organizations/${row._id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Suspend</DropdownMenuItem>
            <DropdownMenuItem>Edit Plan</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage all organizations on the platform
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, subdomain, or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organizations table */}
      <DataTable
        columns={columns}
        data={organizations}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        emptyMessage="No organizations found"
      />
    </div>
  )
}
