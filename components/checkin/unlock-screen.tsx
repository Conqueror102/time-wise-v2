"use client"

import { useState } from "react"
import { getUTCDate } from "@/lib/utils/date"
import { Lock, Loader2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UnlockScreenProps {
  onUnlock: (data: {
    tenantId: string
    organizationName: string
    capturePhotos: boolean
  }) => void
}

export function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [passcode, setPasscode] = useState("")
  const [orgEmail, setOrgEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/organization/verify-passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passcode,
          email: orgEmail.toLowerCase().trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials")
      }

      const capturePhotosValue = data.capturePhotos || false

      // Store in session storage (cleared when browser closes)
      const timestamp = getUTCDate().getTime().toString()
      sessionStorage.setItem("checkInTenantId", data.tenantId)
      sessionStorage.setItem("checkInOrgName", data.organizationName)
      sessionStorage.setItem("capturePhotos", capturePhotosValue ? "true" : "false")
      sessionStorage.setItem("settingsTimestamp", timestamp)

      onUnlock({
        tenantId: data.tenantId,
        organizationName: data.organizationName,
        capturePhotos: capturePhotosValue,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Check-In System Locked</CardTitle>
            <CardDescription>
              Enter your organization credentials to unlock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgEmail">Organization Email</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  placeholder="admin@company.com"
                  value={orgEmail}
                  onChange={(e) => {
                    setOrgEmail(e.target.value)
                    setError("")
                  }}
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passcode">Check-In Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  placeholder="Enter passcode"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value)
                    setError("")
                  }}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !passcode || !orgEmail}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Unlock Check-In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Don't have credentials?</p>
              <p className="mt-1">Contact your organization administrator</p>
              <p className="mt-2 text-xs">Both email and passcode are required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}