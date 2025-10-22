"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Download, User } from "lucide-react"

interface Staff {
  staffId: string
  name: string
  department: string
  position: string
  qrCode: string
}

const departments = [
  "Human Resources",
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "Customer Support",
]

export function StaffRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    position: "",
  })
  const [loading, setLoading] = useState(false)
  const [registeredStaff, setRegisteredStaff] = useState<Staff | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/staff/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setRegisteredStaff(data.staff)
        setFormData({ name: "", department: "", position: "" })
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!registeredStaff) return

    const link = document.createElement("a")
    link.download = `${registeredStaff.staffId}-qr-code.png`
    link.href = registeredStaff.qrCode
    link.click()
  }

  if (registeredStaff) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Registration Successful!</CardTitle>
          <CardDescription>Staff member has been registered successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <img src={registeredStaff.qrCode || "/placeholder.svg"} alt="QR Code" className="mx-auto mb-2" />
              <p className="font-mono text-lg font-bold">{registeredStaff.staffId}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {registeredStaff.name}
              </p>
              <p>
                <strong>Department:</strong> {registeredStaff.department}
              </p>
              <p>
                <strong>Position:</strong> {registeredStaff.position}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadQRCode} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button onClick={() => setRegisteredStaff(null)} className="flex-1">
              Register Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Staff Registration</CardTitle>
        <CardDescription>Register a new staff member</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              type="text"
              placeholder="Enter position/title"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register Staff"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
