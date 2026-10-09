"use client"

/**
 * Organization Settings Page
 */

import { useEffect, useState } from "react"
import { Save, Building2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckInUrlCopy } from "@/components/dashboard/check-in-url-copy"
import { FingerprintDevices } from "@/components/dashboard/fingerprint-devices"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

export default function SettingsPage() {
  const { toast } = useToast()
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [faceRecognitionAvailable, setFaceRecognitionAvailable] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [settings, setSettings] = useState({
    workStartTime: "09:00",
    latenessTime: "09:00",
    workEndTime: "17:00",
    earlyDepartureTime: "17:00",
    timezone: "UTC",
    checkInPasscode: "",
    capturePhotos: false,
    verifyFaceOnIdCheckIn: false,
    enabledCheckInMethods: {
      qrCode: true,
      manualEntry: true,
      faceRecognition: false,
    },
  })

  const applyOrganization = (org: any) => {
    setOrganization(org)
    setSettings({
      workStartTime: org.settings?.workStartTime || "09:00",
      latenessTime: org.settings?.latenessTime || "09:00",
      workEndTime: org.settings?.workEndTime || "17:00",
      earlyDepartureTime: org.settings?.earlyDepartureTime || "17:00",
      timezone: org.settings?.timezone || "UTC",
      checkInPasscode: org.settings?.checkInPasscode || "",
      capturePhotos: org.settings?.capturePhotos === true,
      verifyFaceOnIdCheckIn: org.settings?.verifyFaceOnIdCheckIn === true,
      enabledCheckInMethods: org.settings?.enabledCheckInMethods || {
        qrCode: true,
        manualEntry: true,
        faceRecognition: false,
      },
    })
  }

  useEffect(() => {
    // Load the latest settings from the server rather than the copy cached at login
    apiFetch("/api/auth/me")
      .then((data) => {
        localStorage.setItem("organization", JSON.stringify(data.organization))
        applyOrganization(data.organization)
        setFaceRecognitionAvailable(data.serverFeatures?.faceRecognition !== false)
        setCurrentUserRole(data.user?.role || "")
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const data = await apiFetch("/api/organization/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      })

      localStorage.setItem("organization", JSON.stringify(data.organization))
      applyOrganization(data.organization)

      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  if (!organization) {
    if (error) {
      return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization's configuration</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Information
          </CardTitle>
          <CardDescription>Basic details about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={organization.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Subdomain</Label>
              <Input value={organization.subdomain} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Admin Email</Label>
            <Input value={organization.adminEmail} disabled />
          </div>

        </CardContent>
      </Card>

      {/* Work Hours Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Work Hours & Attendance
          </CardTitle>
          <CardDescription>
            Configure work schedule and lateness rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStart">Work Start Time</Label>
              <Input
                id="workStart"
                type="time"
                value={settings.workStartTime}
                onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latenessTime">Lateness Threshold</Label>
              <Input
                id="latenessTime"
                type="time"
                value={settings.latenessTime}
                onChange={(e) => setSettings({ ...settings, latenessTime: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Check-ins after this time are marked as late
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workEnd">Work End Time</Label>
              <Input
                id="workEnd"
                type="time"
                value={settings.workEndTime}
                onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="earlyDepartureTime">Early Departure Threshold</Label>
              <Input
                id="earlyDepartureTime"
                type="time"
                value={settings.earlyDepartureTime}
                onChange={(e) => setSettings({ ...settings, earlyDepartureTime: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Check-outs before this time are marked as early
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeZones(settings.timezone).map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Lateness, early departures and &quot;today&quot; are calculated in this timezone
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInPasscode">Check-In Passcode</Label>
            <Input
              id="checkInPasscode"
              type="text"
              value={settings.checkInPasscode}
              onChange={(e) => setSettings({ ...settings, checkInPasscode: e.target.value })}
              placeholder="4-32 letters or digits"
              maxLength={32}
            />
            <p className="text-xs text-gray-500">
              Required to unlock the check-in page. Prevents unauthorized access.
            </p>
          </div>

          {/* Copy Check-In URL */}
          <div className="space-y-2 border-t pt-4 mt-4">
            <Label>Copy Check-In URL</Label>
            <CheckInUrlCopy
              organization={organization}
              onPasscodeSet={(org) => {
                setOrganization(org)
                setSettings((prev) => ({ ...prev, checkInPasscode: org.settings?.checkInPasscode || "" }))
              }}
            />
          </div>

          <div className="space-y-4 border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-900">Photo Verification</h3>
            
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              settings.capturePhotos ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex-1">
                <Label htmlFor="capturePhotos" className="cursor-pointer font-medium">
                  Capture Photos on Check-In/Out
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically take photos to verify staff identity and prevent fraud
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${
                  settings.capturePhotos ? "text-green-700" : "text-gray-600"
                }`}>
                  {settings.capturePhotos ? "Enabled" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="capturePhotos"
                    checked={settings.capturePhotos}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, capturePhotos: e.target.checked }))
                    }}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.capturePhotos ? "bg-blue-600" : "bg-gray-300"
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.capturePhotos ? "translate-x-5" : "translate-x-0"
                    } mt-0.5 ml-0.5`}></div>
                  </div>
                </label>
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              settings.verifyFaceOnIdCheckIn && faceRecognitionAvailable ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex-1">
                <Label htmlFor="verifyFaceOnIdCheckIn" className={`font-medium ${faceRecognitionAvailable ? "cursor-pointer" : "text-gray-500"}`}>
                  Verify Face on QR Code and Staff ID Check-Ins
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  The kiosk compares a photo with the staff member&apos;s registered face, so a borrowed QR code or
                  Staff ID can&apos;t be used by someone else. Staff without a registered face check in as normal.
                </p>
                {!faceRecognitionAvailable && (
                  <p className="text-xs text-amber-700 mt-1">
                    Needs face recognition, which isn&apos;t set up on this server yet.
                  </p>
                )}
              </div>
              <label className={`relative inline-flex items-center ml-4 ${faceRecognitionAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                <input
                  type="checkbox"
                  id="verifyFaceOnIdCheckIn"
                  checked={settings.verifyFaceOnIdCheckIn}
                  disabled={!faceRecognitionAvailable}
                  onChange={(e) => setSettings(prev => ({ ...prev, verifyFaceOnIdCheckIn: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  settings.verifyFaceOnIdCheckIn ? "bg-blue-600" : "bg-gray-300"
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.verifyFaceOnIdCheckIn ? "translate-x-5" : "translate-x-0"
                  } mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Photo retention is fixed at 7 days and not editable */}
            <div className="space-y-2">
              <Label>Photo Retention Period</Label>
              <p className="text-sm text-gray-600">Check-in photos are deleted automatically after 7 days.</p>
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Allowed Check-In Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Check-In Methods</CardTitle>
          <CardDescription>
            Enable or disable specific check-in methods for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "QR Code", key: "qrCode" },
              { name: "Manual Entry", key: "manualEntry" },
              { name: "Face Recognition", key: "faceRecognition" },
            ].map((method) => {
              const isEnabled = settings.enabledCheckInMethods[method.key as keyof typeof settings.enabledCheckInMethods]
              
              return (
                <div
                  key={method.name}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    isEnabled ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`method-${method.key}`}
                      className="font-medium cursor-pointer"
                    >
                      {method.name}
                    </label>
                    {method.key === "faceRecognition" && !faceRecognitionAvailable && (
                      <p className="text-xs text-amber-700 mt-1">
                        Face recognition is not set up on this server yet, so staff won&apos;t see this option.
                        Ask your administrator to configure CompreFace.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <>
                        <span className={`text-sm font-medium ${
                          isEnabled ? "text-green-700" : "text-gray-600"
                        }`}>
                          {isEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id={`method-${method.key}`}
                            checked={isEnabled}
                            onChange={(e) => {
                              // Check if trying to disable the last enabled method
                              const currentMethods = settings.enabledCheckInMethods
                              const enabledCount = Object.values(currentMethods).filter(Boolean).length
                              
                              if (!e.target.checked && enabledCount === 1) {
                                toast({
                                  variant: "destructive",
                                  title: "Cannot Disable",
                                  description: "At least one check-in method must be enabled.",
                                })
                                return
                              }
                              
                              setSettings(prev => ({
                                ...prev,
                                enabledCheckInMethods: {
                                  ...prev.enabledCheckInMethods,
                                  [method.key]: e.target.checked
                                }
                              }))
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            isEnabled ? "bg-green-600" : "bg-gray-300"
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              isEnabled ? "translate-x-5" : "translate-x-0"
                            } mt-0.5 ml-0.5`}></div>
                          </div>
                        </label>
                    </>
                  </div>
                </div>
              )
            })}
          </div>
          <FingerprintDevices canManage={currentUserRole === "org_admin"} />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

    </div>
  )
}

/** All IANA timezones the browser knows, making sure the current value is listed */
function timeZones(current: string): string[] {
  let zones: string[] = []
  try {
    zones = (Intl as any).supportedValuesOf("timeZone")
  } catch {
    zones = ["UTC", "Africa/Lagos", "Europe/London", "America/New_York"]
  }
  return zones.includes(current) ? zones : [current, ...zones]
}
