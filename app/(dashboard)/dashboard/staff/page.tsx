"use client"

/**
 * Staff Management Page
 */

import { useEffect, useState } from "react"
import { Plus, Search, Edit, Trash2, QrCode, Fingerprint, UserCheck, UserX, ScanFace, ExternalLink, Copy, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
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
import { apiFetch } from "@/lib/api-client"
import { staffPin } from "@/lib/devices/pin"

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
  faceData?: { registeredAt: string }
  qrUpdatedAt?: string
}

// QR codes regenerated after the person was added (old printed badges no longer work)
const hasUpgradedQr = (s: Staff) =>
  !!s.qrUpdatedAt && new Date(s.qrUpdatedAt).getTime() - new Date(s.createdAt).getTime() > 60_000

const hasFace = (s: Staff) => !!s.faceData

export default function StaffPage() {
  const { toast } = useToast()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showFingerprintDialog, setShowFingerprintDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [saving, setSaving] = useState(false)
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
      const data = await apiFetch("/api/staff")
      setStaff(data.staff || [])
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }

  const showError = (title: string, err: unknown) => {
    toast({
      variant: "destructive",
      title,
      description: err instanceof Error ? err.message : String(err),
    })
  }

  const resetForm = () => setFormData({ name: "", email: "", department: "", position: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch("/api/staff", { method: "POST", body: JSON.stringify(formData) })
      toast({
        title: "Success!",
        description: `${formData.name} has been registered successfully.`,
      })
      setShowAddDialog(false)
      resetForm()
      fetchStaff()
    } catch (err) {
      showError("Registration Failed", err)
    } finally {
      setSaving(false)
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

    setSaving(true)
    try {
      await apiFetch(`/api/staff/${selectedStaff.staffId}`, { method: "PATCH", body: JSON.stringify(formData) })
      toast({ title: "Saved", description: `${formData.name}'s details were updated.` })
      setShowEditDialog(false)
      setSelectedStaff(null)
      resetForm()
      fetchStaff()
    } catch (err) {
      showError("Update Failed", err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (member: Staff) => {
    try {
      await apiFetch(`/api/staff/${member.staffId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      toast({
        title: member.isActive ? "Staff deactivated" : "Staff reactivated",
        description: member.isActive
          ? `${member.name} can no longer check in and is excluded from attendance stats.`
          : `${member.name} can check in again.`,
      })
      fetchStaff()
    } catch (err) {
      showError("Update Failed", err)
    }
  }

  const handleDelete = async (member: Staff) => {
    if (!confirm(`Delete ${member.name}? Their attendance history is kept, but this cannot be undone.`)) {
      return
    }

    try {
      await apiFetch(`/api/staff/${member.staffId}`, { method: "DELETE" })
      toast({ title: "Deleted", description: `${member.name} was removed.` })
      fetchStaff()
    } catch (err) {
      showError("Delete Failed", err)
    }
  }

  const createEnrollmentLink = async (member: Staff): Promise<string> => {
    const data = await apiFetch(`/api/staff/${member.staffId}/enrollment`, { method: "POST" })
    return `${window.location.origin}${data.path}`
  }

  const openEnrollment = async (member: Staff) => {
    // Open the tab synchronously so the browser doesn't treat it as a pop-up
    const tab = window.open("about:blank", "_blank")
    try {
      const url = await createEnrollmentLink(member)
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch (err) {
      tab?.close()
      showError("Could not open registration", err)
    }
  }

  const copyEnrollmentLink = async (member: Staff) => {
    try {
      await navigator.clipboard.writeText(await createEnrollmentLink(member))
      toast({ title: "Link copied", description: "Open it on the check-in device. It expires in 24 hours." })
    } catch (err) {
      showError("Could not create link", err)
    }
  }

  const printQRCode = (member: Staff) => {
    const win = window.open("", "_blank", "width=420,height=520")
    if (!win) return
    const doc = win.document
    doc.title = `QR Code - ${member.name}`
    doc.body.style.cssText = "font-family:sans-serif;text-align:center;padding:24px"
    const img = doc.createElement("img")
    img.src = member.qrCode
    img.style.cssText = "width:300px;height:300px"
    const name = doc.createElement("h2")
    name.textContent = member.name
    const id = doc.createElement("p")
    id.textContent = member.staffId
    doc.body.append(img, name, id)
    img.onload = () => {
      win.focus()
      win.print()
    }
  }

  const filteredStaff = staff.filter((s) =>
    [s.name, s.staffId, s.department, s.email].some((field) =>
      (field || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <>
      
      <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's employees
          </p>
        </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
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
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Registering..." : "Register Staff"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {staff.some(hasUpgradedQr) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm">
          <strong>New QR codes:</strong> QR codes are now signed so they can&apos;t be faked from a staff ID. Badges
          printed before {new Date(Math.max(...staff.filter(hasUpgradedQr).map((s) => new Date(s.qrUpdatedAt!).getTime()))).toLocaleDateString()}{" "}
          no longer work — print new ones with the <strong>QR</strong> or <strong>Download</strong> buttons.
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
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {s.name}
                      {!s.isActive && (
                        <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {s.staffId} • {s.department} • {s.position}
                    </div>
                    {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                    <div className="flex gap-2 mt-1">
                      {hasFace(s) && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          <ScanFace className="w-3 h-3" /> Face
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        title="User ID to enter when enrolling this person on a fingerprint device"
                      >
                        <Fingerprint className="w-3 h-3" /> Device PIN {staffPin(s.staffId)}
                      </span>
                    </div>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStaff(s)
                        setShowFingerprintDialog(true)
                      }}
                      title="Register face or fingerprint"
                    >
                      <ScanFace className="w-4 h-4 mr-1" />
                      Face / Fingerprint
                    </Button>
                    <QRDownloadButton
                      qrCodeUrl={s.qrCode}
                      staffName={s.name}
                      staffId={s.staffId}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(s)}
                      title={s.isActive ? "Deactivate" : "Reactivate"}
                    >
                      {s.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(s)}
                      title="Delete"
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
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Updating..." : "Update Staff"}
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
                <Button onClick={() => printQRCode(selectedStaff)} variant="outline" className="flex-1">
                  Print QR Code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fingerprint Registration Dialog */}
      <Dialog
        open={showFingerprintDialog}
        onOpenChange={(open) => {
          setShowFingerprintDialog(open)
          // Pick up registrations completed in the other tab
          if (!open) fetchStaff()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanFace className="w-5 h-5" />
              Face &amp; Fingerprint for {selectedStaff?.name}
            </DialogTitle>
            <DialogDescription>Staff ID: {selectedStaff?.staffId}</DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4">
              <div className="rounded-lg border divide-y">
                {[
                  {
                    label: "Face",
                    done: hasFace(selectedStaff),
                    note: "Stored on the server, so it works at any check-in device.",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3">
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.label} {item.done ? "registered" : "not registered"}
                      </div>
                      <div className="text-sm text-gray-500">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button className="w-full" onClick={() => openEnrollment(selectedStaff)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Register on this device
                </Button>
                <Button variant="outline" className="w-full" onClick={() => copyEnrollmentLink(selectedStaff)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link for another device
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Links expire after 24 hours.
                </p>
              </div>

              <div className="rounded-lg border p-3 flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Fingerprint</div>
                  <div className="text-gray-500">
                    Enrol {selectedStaff.name}&apos;s finger directly on your fingerprint device, using user ID / PIN{" "}
                    <strong className="text-gray-900">{staffPin(selectedStaff.staffId)}</strong>. Devices are set up under
                    Settings → Fingerprint Devices.
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
