"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  KeyRound,
  CheckCircle,
  Clock,
  AlertTriangle,
  LogIn,
  LogOut,
  Building2,
  Fingerprint,
  User,
  Crown,
} from "lucide-react"
import { EnhancedQRScanner } from "./enhanced-qr-scanner"
import { FingerprintScanner } from "./fingerprint-scanner"
import { FaceRecognition } from "./face-recognition"
import { SubscriptionGate } from "./subscription-gate"
import type { Organization, AuthMethod } from "@/lib/models"
import { canUseMethod, getPlanByTier } from "@/lib/subscription-plans"

interface EnhancedCheckInProps {
  organization: Organization
  onUpgrade: () => void
}

export function EnhancedCheckIn({ organization, onUpgrade }: EnhancedCheckInProps) {
  const [staffId, setStaffId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const [activeMethod, setActiveMethod] = useState<AuthMethod>("manual")
  const [showUpgradeGate, setShowUpgradeGate] = useState(false)
  const [gateInfo, setGateInfo] = useState({ feature: "", requiredTier: "" })

  const handleMethodChange = (method: AuthMethod) => {
    if (!canUseMethod(organization.subscriptionTier, method)) {
      const requiredTier = method === "qr" ? "basic" : method === "fingerprint" ? "premium" : "enterprise"
      setGateInfo({
        feature: `${method.charAt(0).toUpperCase() + method.slice(1)} Authentication`,
        requiredTier,
      })
      setShowUpgradeGate(true)
      return
    }
    setActiveMethod(method)
  }

  const handleCheckIn = async (id: string, type: "check-in" | "check-out", method: AuthMethod = activeMethod) => {
    if (!id.trim() && method === "manual") {
      setMessage("Please enter a staff ID")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: id.trim(),
          type,
          method,
          organizationId: organization._id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(
          `${data.staff} ${type === "check-in" ? "checked in" : "checked out"} successfully${data.isLate ? " (Late)" : ""}`,
        )
        setMessageType(data.isLate ? "warning" : "success")
        setStaffId("")
      } else {
        setMessage(data.error || `${type} failed`)
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricScan = (data: string, method: AuthMethod) => {
    // In a real implementation, you would verify the biometric data against stored data
    // For demo purposes, we'll extract a staff ID from the data or use a mock ID
    const mockStaffId = "BIO" + Math.random().toString(36).substr(2, 4).toUpperCase()
    setStaffId(mockStaffId)
    handleCheckIn(mockStaffId, "check-in", method)
  }

  const getMethodIcon = (method: AuthMethod) => {
    switch (method) {
      case "manual":
        return <KeyRound className="w-4 h-4" />
      case "qr":
        return <QrCode className="w-4 h-4" />
      case "fingerprint":
        return <Fingerprint className="w-4 h-4" />
      case "face":
        return <User className="w-4 h-4" />
    }
  }

  const getMethodLabel = (method: AuthMethod) => {
    switch (method) {
      case "manual":
        return "Staff ID"
      case "qr":
        return "QR Code"
      case "fingerprint":
        return "Fingerprint"
      case "face":
        return "Face ID"
    }
  }

  const isMethodAvailable = (method: AuthMethod) => {
    return organization.allowedMethods.includes(method)
  }

  const currentPlan = getPlanByTier(organization.subscriptionTier)

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <>
      <div className="web-app-container">
        {/* Header */}
        <header className="gradient-primary shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-teal rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{organization.name}</h1>
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <span>Attendance System</span>
                    <Badge className="bg-white/20 text-white text-xs">
                      {currentPlan?.name}
                      {organization.subscriptionTier === "enterprise" && <Crown className="w-3 h-3 ml-1" />}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-white text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            <Card className="modern-card animate-slide-up">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 gradient-accent rounded-2xl flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-primary-navy">Check In / Check Out</CardTitle>
                <CardDescription className="text-gray-600">Choose your preferred authentication method</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs
                  value={activeMethod}
                  onValueChange={(value) => handleMethodChange(value as AuthMethod)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-100">
                    {(["manual", "qr", "fingerprint", "face"] as AuthMethod[]).map((method) => (
                      <TabsTrigger
                        key={method}
                        value={method}
                        disabled={!isMethodAvailable(method)}
                        className={`flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary-navy ${
                          !isMethodAvailable(method) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {getMethodIcon(method)}
                        <span className="hidden sm:inline">{getMethodLabel(method)}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4 mt-6">
                    <div className="space-y-3">
                      <Label htmlFor="staffId" className="text-sm font-medium text-gray-700">
                        Staff ID
                      </Label>
                      <Input
                        id="staffId"
                        type="text"
                        placeholder="e.g., AB1234"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                        className="text-center font-mono text-lg tracking-wider h-12 border-2 border-gray-200 focus:border-primary-navy focus:ring-primary-navy/20"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="qr" className="space-y-4 mt-6">
                    <div className="text-center">
                      <EnhancedQRScanner
                        onScan={(scannedId) => {
                          setStaffId(scannedId)
                          handleCheckIn(scannedId, "check-in", "qr")
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fingerprint" className="space-y-4 mt-6">
                    <div className="text-center">
                      <FingerprintScanner
                        mode="authenticate"
                        onScan={(data) => handleBiometricScan(data, "fingerprint")}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="face" className="space-y-4 mt-6">
                    <div className="text-center">
                      <FaceRecognition mode="authenticate" onScan={(data) => handleBiometricScan(data, "face")} />
                    </div>
                  </TabsContent>
                </Tabs>

                {message && (
                  <Alert variant={messageType === "error" ? "destructive" : "default"} className="animate-fade-in">
                    {messageType === "success" && <CheckCircle className="w-4 h-4" />}
                    {messageType === "warning" && <AlertTriangle className="w-4 h-4" />}
                    {messageType === "error" && <AlertTriangle className="w-4 h-4" />}
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {activeMethod === "manual" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      onClick={() => handleCheckIn(staffId, "check-in")}
                      disabled={loading || !staffId.trim()}
                      className="btn-success h-12 font-semibold"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {loading ? "Processing..." : "Check In"}
                    </Button>
                    <Button
                      onClick={() => handleCheckIn(staffId, "check-out")}
                      disabled={loading || !staffId.trim()}
                      className="btn-primary h-12 font-semibold"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {loading ? "Processing..." : "Check Out"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade Prompt */}
            {organization.subscriptionTier === "free" && (
              <div className="mt-6">
                <Card className="modern-card border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardContent className="p-4 text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-purple-700 mb-3">Unlock QR codes, biometric authentication, and more!</p>
                    <Button
                      onClick={onUpgrade}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      Upgrade Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 text-center">
              <Card className="modern-card">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-2">Need assistance?</p>
                  <p className="text-xs text-gray-500">Contact your system administrator</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Subscription Gate */}
      {showUpgradeGate && (
        <SubscriptionGate
          organization={organization}
          requiredTier={gateInfo.requiredTier}
          feature={gateInfo.feature}
          onUpgrade={() => {
            setShowUpgradeGate(false)
            onUpgrade()
          }}
        />
      )}
    </>
  )
}
