"use client"

/**
 * Staff Management Page
 */

import { useEffect, useState } from "react"
import { Plus, Search, Edit, Trash2, QrCode, Crown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canAddStaff, PLAN_FEATURES, type PlanType } from "@/lib/features/feature-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { QRDownloadButton } from "@/components/qr-download-button"

interface Staff {
  _id: string
  staffId: string
  name: string
  email?: string
  department: string
  position: string
  qrCode: string
  isActive: boolean
  createdAt: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [organization, setOrganization] = useState<any>(null)
  const isDevelopment = process.env.NODE_ENV === "development"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
  })

  useEffect(() => {
    const orgData = localStorage.getItem("organization")
    if (orgData) {
      setOrganization(JSON.parse(orgData))
    }
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch staff")
      }

      const data = await response.json()
      setStaff(data.staff || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to register staff")
      }

      setShowAddDialog(false)
      setFormData({ name: "", email: "", department: "", position: "" })
      fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register staff")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff)
    setFormData({
      name: staff.name,
      email: staff.email || "",
      department: staff.department,
      position: staff.position,
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return

    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/staff/${selectedStaff.staffId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update staff")
      }

      setShowEditDialog(false)
      setSelectedStaff(null)
      setFormData({ name: "", email: "", department: "", position: "" })
      fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return
    }

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete staff")
      }

      fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff")
    }
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canAdd = organization
    ? canAddStaff(organization.subscriptionTier as PlanType, staff.length, isDevelopment)
    : false

  const planType = (organization?.subscriptionTier as PlanType) || "starter"
  const maxStaff = organization && PLAN_FEATURES[planType]
    ? PLAN_FEATURES[planType].maxStaff
    : 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's employees
            {!isDevelopment && maxStaff !== -1 && (
              <span className="ml-2 text-sm">
                ({staff.length}/{maxStaff} staff members)
              </span>
            )}
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={!canAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Staff</DialogTitle>
              <DialogDescription>Add a new employee to your organization</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register Staff"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Limit Warning */}
      {!canAdd && !isDevelopment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Staff Limit Reached</h3>
              <p className="text-sm text-yellow-800 mt-1">
                You've reached the maximum of {maxStaff} staff members for your {organization?.subscriptionTier} plan.
                Upgrade to add more staff members.
              </p>
              <Button
                size="sm"
                className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => window.location.href = "/dashboard/settings"}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by name, ID, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff ({filteredStaff.length})</CardTitle>
          <CardDescription>Manage your organization's employees</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No staff members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStaff.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500">
                      {s.staffId} • {s.department} • {s.position}
                    </div>
                    {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(s)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStaff(s)
                        setShowQRDialog(true)
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </Button>
                    <QRDownloadButton
                      qrCodeUrl={s.qrCode}
                      staffName={s.name}
                      staffId={s.staffId}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(s.staffId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Details</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department *</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position *</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update Staff"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedStaff(null)
                  setFormData({ name: "", email: "", department: "", position: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStaff?.name}'s QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to check in/out (Staff ID: {selectedStaff?.staffId})
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={selectedStaff.qrCode}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg"
              />
              <div className="flex gap-2 w-full">
                <QRDownloadButton
                  qrCodeUrl={selectedStaff.qrCode}
                  staffName={selectedStaff.name}
                  staffId={selectedStaff.staffId}
                  variant="default"
                  size="default"
                  className="flex-1"
                />
                <Button onClick={() => window.print()} variant="outline" className="flex-1">
                  Print QR Code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
