"use client"

/**
 * Organization Settings Page
 */

import { useEffect, useState } from "react"
import { Save, Building2, Clock, Users, Crown, Check, Zap, Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLAN_FEATURES, PLAN_PRICES, hasFeatureAccess, type PlanType, type PlanFeatures } from "@/lib/features/feature-manager"

export default function SettingsPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"professional" | "enterprise">("professional")
  const isDevelopment = process.env.NODE_ENV === "development"
  const [settings, setSettings] = useState({
    workStartTime: "09:00",
    latenessTime: "09:00",
    workEndTime: "17:00",
    earlyDepartureTime: "17:00",
    timezone: "UTC",
    checkInPasscode: "",
    capturePhotos: false,
    photoRetentionDays: 7,
    fingerprintEnabled: false,
    enabledCheckInMethods: {
      qrCode: true,
      manualEntry: true,
      faceRecognition: false,
    },
  })

  useEffect(() => {
    const orgData = localStorage.getItem("organization")
    if (orgData) {
      try {
        const org = JSON.parse(orgData)
        console.log("Loaded organization data:", org)
        console.log("capturePhotos setting:", org.settings?.capturePhotos)
        
        // Ensure organization has a valid subscriptionTier
        if (!org.subscriptionTier) {
          console.warn("Organization missing subscriptionTier, defaulting to starter")
          org.subscriptionTier = "starter"
        }
        
        setOrganization(org)
        
        // Ensure boolean conversion for capturePhotos and fingerprintEnabled
        const capturePhotos = org.settings?.capturePhotos === true || org.settings?.capturePhotos === "true"
        const fingerprintEnabled = org.settings?.fingerprintEnabled === true || org.settings?.fingerprintEnabled === "true"
        
        setSettings({
          workStartTime: org.settings?.workStartTime || "09:00",
          latenessTime: org.settings?.latenessTime || "09:00",
          workEndTime: org.settings?.workEndTime || "17:00",
          earlyDepartureTime: org.settings?.earlyDepartureTime || "17:00",
          timezone: org.settings?.timezone || "UTC",
          checkInPasscode: org.settings?.checkInPasscode || "",
          capturePhotos: capturePhotos,
          photoRetentionDays: org.settings?.photoRetentionDays || 7,
          fingerprintEnabled: fingerprintEnabled,
          enabledCheckInMethods: org.settings?.enabledCheckInMethods || {
            qrCode: true,
            manualEntry: true,
            faceRecognition: false,
          },
        })
      } catch (err) {
        console.error("Error parsing organization data:", err)
      }
    }
  }, [])

  const handleUpgrade = async (plan: "professional" | "enterprise") => {
    setUpgrading(true)
    setError("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorizationUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize upgrade")
      setUpgrading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const data = await response.json()
      
      console.log("Settings saved, response:", data)
      
      // Update local storage with the updated organization data
      localStorage.setItem("organization", JSON.stringify(data.organization))
      setOrganization(data.organization)
      
      // Update settings state to reflect saved values
      setSettings({
        workStartTime: data.organization.settings?.workStartTime || "09:00",
        latenessTime: data.organization.settings?.latenessTime || "09:00",
        workEndTime: data.organization.settings?.workEndTime || "17:00",
        earlyDepartureTime: data.organization.settings?.earlyDepartureTime || "17:00",
        timezone: data.organization.settings?.timezone || "UTC",
        checkInPasscode: data.organization.settings?.checkInPasscode || "",
        capturePhotos: data.organization.settings?.capturePhotos === true,
        photoRetentionDays: data.organization.settings?.photoRetentionDays || 7,
        fingerprintEnabled: data.organization.settings?.fingerprintEnabled === true,
        enabledCheckInMethods: data.organization.settings?.enabledCheckInMethods || {
          qrCode: true,
          manualEntry: true,
          faceRecognition: false,
        },
      })

      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  if (!organization) {
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
              <div className="flex items-center gap-2">
                <Input value={organization.subdomain} disabled className="flex-1" />
                <span className="text-sm text-gray-500">.clockin.app</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Admin Email</Label>
            <Input value={organization.adminEmail} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Input
                value={organization.status}
                disabled
                className="capitalize"
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Input
                value={organization.subscriptionTier}
                disabled
                className="capitalize"
              />
            </div>
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
            <Input
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              placeholder="e.g., America/New_York, Europe/London"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInPasscode">Check-In Passcode</Label>
            <Input
              id="checkInPasscode"
              type="text"
              value={settings.checkInPasscode}
              onChange={(e) => setSettings({ ...settings, checkInPasscode: e.target.value })}
              placeholder="Enter 4-6 digit passcode"
              maxLength={6}
            />
            <p className="text-xs text-gray-500">
              Required to unlock the check-in page. Prevents unauthorized access.
            </p>
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
                      console.log("Checkbox changed from", settings.capturePhotos, "to", e.target.checked)
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

            <div className="space-y-2">
              <Label htmlFor="photoRetentionDays">Photo Retention Period (Days)</Label>
              <Input
                id="photoRetentionDays"
                type="number"
                min="1"
                max="30"
                value={settings.photoRetentionDays}
                onChange={(e) => setSettings({ ...settings, photoRetentionDays: parseInt(e.target.value) || 7 })}
              />
              <p className="text-xs text-gray-500">
                Photos will be automatically deleted after this many days (default: 7 days)
              </p>
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Staff Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Management
          </CardTitle>
          <CardDescription>Current staff limits and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Maximum Staff Members</Label>
              <span className="text-2xl font-bold">
                {organization.settings?.maxStaff || 10}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Upgrade your plan to increase staff limit
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                {isDevelopment ? "Development Mode" : "Current Plan"}
              </span>
              <span className="text-sm text-blue-700 capitalize font-semibold">
                {isDevelopment ? "All Features Unlocked" : organization.subscriptionTier}
              </span>
            </div>
            {organization.trialEndsAt && (
              <p className="text-xs text-blue-600 mb-2">
                Trial ends {new Date(organization.trialEndsAt).toLocaleDateString()}
              </p>
            )}
            {!isDevelopment && organization.subscriptionTier !== "enterprise" && (
              <Button 
                variant="default" 
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
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
              { name: "QR Code", feature: "qrCheckIn" as keyof PlanFeatures, key: "qrCode" },
              { name: "Manual Entry", feature: "manualCheckIn" as keyof PlanFeatures, key: "manualEntry" },
              { name: "Face Recognition", feature: "faceCheckIn" as keyof PlanFeatures, key: "faceRecognition" },
            ].map((method) => {
              const hasAccess = hasFeatureAccess(
                organization.subscriptionTier as PlanType,
                method.feature,
                isDevelopment
              )
              const isEnabled = settings.enabledCheckInMethods[method.key as keyof typeof settings.enabledCheckInMethods]
              
              return (
                <div
                  key={method.name}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    !hasAccess ? "bg-gray-50 border-gray-200" : 
                    isEnabled ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`method-${method.key}`}
                      className={`font-medium ${hasAccess ? "cursor-pointer" : "cursor-not-allowed text-gray-500"}`}
                    >
                      {method.name}
                    </label>
                    {!hasAccess && !isDevelopment && (
                      <p className="text-xs text-gray-500 mt-1">
                        Upgrade to Professional or Enterprise to unlock this method
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!hasAccess && !isDevelopment ? (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                        Upgrade Required
                      </span>
                    ) : (
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
                            disabled={!hasAccess}
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
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {!isDevelopment && organization.subscriptionTier === "starter" && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Unlock Advanced Check-In Methods
                </p>
                <p className="text-sm text-blue-800">
                  Upgrade to Professional or Enterprise to enable Face Recognition for enhanced security.
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4 mt-4">
            <h3 className="font-semibold text-gray-900">Biometric Verification</h3>
            
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              settings.fingerprintEnabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex-1">
                <Label htmlFor="fingerprintEnabled" className="cursor-pointer font-medium">
                  Require Biometric Verification
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Staff must use biometric authentication (fingerprint, Face ID, Windows Hello, etc.) after QR/Manual check-in (prevents buddy punching)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${
                  settings.fingerprintEnabled ? "text-blue-700" : "text-gray-600"
                }`}>
                  {settings.fingerprintEnabled ? "Enabled" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="fingerprintEnabled"
                    checked={settings.fingerprintEnabled}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, fingerprintEnabled: e.target.checked }))
                    }}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    settings.fingerprintEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.fingerprintEnabled ? "translate-x-5" : "translate-x-0"
                    } mt-0.5 ml-0.5`}></div>
                  </div>
                </label>
              </div>
            </div>

            {settings.fingerprintEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Staff must register their biometric authentication on the check-in device. 
                  Go to Staff Management → Click "Fingerprint" button for registration instructions.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
                <p className="text-gray-600 mt-1">Choose the plan that fits your needs</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Professional Plan */}
              <div
                onClick={() => setSelectedPlan("professional")}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === "professional"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Professional</h3>
                  </div>
                  {selectedPlan === "professional" && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">₦29,000</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Up to 50 staff members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">All check-in methods (QR, Manual, Face, Fingerprint)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Photo verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced analytics & reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Export data (CSV, Excel)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Enterprise Plan */}
              <div
                onClick={() => setSelectedPlan("enterprise")}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
                  selectedPlan === "enterprise"
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  BEST VALUE
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold">Enterprise</h3>
                  </div>
                  {selectedPlan === "enterprise" && (
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">₦99,000</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">Unlimited staff members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">All Professional features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">API access for integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">24/7 priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={upgrading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {upgrading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to {selectedPlan === "professional" ? "Professional" : "Enterprise"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
