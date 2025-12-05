"use client"

/**
 * Public Check-In/Out Interface - Modular Version
 * Can be used on kiosk or staff mobile devices
 */

import { useState, useEffect } from "react"
import React from "react"
import { getUTCDate } from "@/lib/utils/date"
import { User, QrCode, ScanFace, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaceRecognition } from "@/components/face-recognition"
import { UnlockScreen } from "@/components/checkin/unlock-screen"
import { BiometricVerificationModal } from "@/components/checkin/fingerprint-verification-modal"
import { CheckinHeader } from "@/components/checkin/checkin-header"
import { SuccessMessage } from "@/components/checkin/success-message"
import { ManualEntryTab } from "@/components/checkin/manual-entry-tab"
import { QRScannerTab } from "@/components/checkin/qr-scanner-tab"
import { useCheckin } from "@/hooks/use-checkin"
import { useToast } from "@/hooks/use-toast"
import { useSubscriptionPayment } from "@/hooks/use-subscription-payment"
import { Toaster } from "@/components/ui/toaster"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { getFeatureGateMessage, getRecommendedPlan } from "@/lib/features/feature-manager"

export default function CheckInPage() {
  // Core state
  const [staffId, setStaffId] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")
  const [scannerKey, setScannerKey] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [tenantId, setTenantId] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [capturePhotos, setCapturePhotos] = useState(false)
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false)
  const [isInTrial, setIsInTrial] = useState(false)
  const [showQRSuccess, setShowQRSuccess] = useState(false)
  const [scannerClosing, setScannerClosing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<"photoVerification" | "fingerprintCheckIn">("photoVerification")
  const [subscriptionPlan, setSubscriptionPlan] = useState<"starter" | "professional" | "enterprise">("starter")
  const [subscriptionTrialActive, setSubscriptionTrialActive] = useState(false)
  const [showFingerprintModal, setShowFingerprintModal] = useState(false)
  const [pendingCheckInType, setPendingCheckInType] = useState<"check-in" | "check-out" | null>(null)
  const [enabledCheckInMethods, setEnabledCheckInMethods] = useState({
    qrCode: true,
    manualEntry: true,
    faceRecognition: false,
  })

  // Toast notifications
  const { toast } = useToast()
  
  // Payment hook
  const { initiateUpgradePayment, loading: paymentLoading } = useSubscriptionPayment()

  // Use custom hook for check-in logic
  const {
    loading,
    success,
    error,
    attendanceStatus,
    statusLoading,
    lastAction,
    checkAttendanceStatus,
    handleCheckIn: handleCheckInLogic,
    clearMessages,
    resetAttendanceStatus,
  } = useCheckin(tenantId)

  // Simplified handlers
  const handleUnlock = (data: { 
    tenantId: string; 
    organizationName: string; 
    capturePhotos: boolean; 
    fingerprintEnabled?: boolean; 
    isInTrial?: boolean;
    enabledCheckInMethods?: {
      qrCode: boolean;
      manualEntry: boolean;
      faceRecognition: boolean;
    }
  }) => {
    setTenantId(data.tenantId)
    setOrganizationName(data.organizationName)
    
    // Fetch subscription status to check feature access (include token in prod)
    ;(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch("/api/subscription/status", { headers })
        if (res.ok) {
          const subData = await res.json()
          setSubscriptionPlan(subData.plan || "starter")
          setSubscriptionTrialActive(subData.isTrialActive || false)

          // During 14-day trial, ALL features are available
          // After trial ends, features are locked based on plan
          const isDev = process.env.NODE_ENV === "development"
          const isInTrialPeriod = subData.plan === "starter" && subData.isTrialActive
          
          // Photo verification: Available in trial, professional, and enterprise
          const canUsePhoto = isDev || isInTrialPeriod || subData.plan === "professional" || subData.plan === "enterprise"
          
          // Fingerprint verification: Available in trial and enterprise
          const canUseFingerprint = isDev || isInTrialPeriod || subData.plan === "enterprise"

          setCapturePhotos(!!(data.capturePhotos && canUsePhoto))
          setFingerprintEnabled(!!(data.fingerprintEnabled && canUseFingerprint))
        } else {
          // If status endpoint returned non-OK, fall back conservatively
          const isDev = process.env.NODE_ENV === "development"
          setCapturePhotos(isDev ? data.capturePhotos : false)
          setFingerprintEnabled(isDev ? !!data.fingerprintEnabled : false)
        }
      } catch (err) {
        // Fallback if subscription check fails - disable gated features for security
        const isDev = process.env.NODE_ENV === "development"
        setCapturePhotos(isDev ? data.capturePhotos : false)
        setFingerprintEnabled(isDev ? !!data.fingerprintEnabled : false)
        if (!isDev && typeof document !== 'undefined') {
          console.warn('Unable to verify subscription status - some features disabled for security')
        }
      }
    })()
    
    setIsInTrial(data.isInTrial || false)
    setEnabledCheckInMethods(data.enabledCheckInMethods || {
      qrCode: true,
      manualEntry: true,
      faceRecognition: false,
    })
    setIsUnlocked(true)
  }

  const handleQRScan = async (scannedId: string) => {
    try {
      // Decode QR code data
      let decodedStaffId = scannedId.trim()
      let decodedData: any = null

      // Try to decode base64 encoded JSON
      if (scannedId.includes("eyJ") || scannedId.includes("=")) {
        try {
          const decoded = atob(scannedId)
          decodedData = JSON.parse(decoded)
          decodedStaffId = decodedData.staffId || decodedData.id || scannedId
          console.log("Decoded QR data:", decodedData)
        } catch (e) {
          console.log("QR decode failed, using raw value:", e)
        }
      }

      // Validate staff ID
      if (!decodedStaffId || decodedStaffId.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "No staff ID found in QR code",
        })
        setShowScanner(false)
        setScannerKey((prev) => prev + 1)
        return
      }

      // Clean up staff ID
      const finalStaffId = decodedStaffId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

      if (!finalStaffId || finalStaffId.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "Invalid staff ID format",
        })
        setShowScanner(false)
        setScannerKey((prev) => prev + 1)
        return
      }

      // Update state
      setStaffId(finalStaffId)
      setShowScanner(false)
      setScannerKey((prev) => prev + 1)
      toast({
        title: "QR Code Scanned",
        description: `Staff ID: ${finalStaffId}`,
      })

      // Check attendance status
      await checkAttendanceStatus(finalStaffId)

      // Scroll to action buttons after QR scan
      setTimeout(() => {
        const actionButtons = document.querySelector('[data-qr-actions]')
        if (actionButtons) {
          actionButtons.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
          })
        }
      }, 500)
    } catch (err) {
      console.error("QR scan error:", err)
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Failed to process QR code. Please try again.",
      })
      setShowScanner(false)
      setScannerKey((prev) => prev + 1)
    }
  }

  const handleBiometricScan = async (scannedStaffId: string) => {
    setStaffId(scannedStaffId)
    
    // Check attendance status first
    await checkAttendanceStatus(scannedStaffId)
    
    // Wait a bit for status to update
    setTimeout(async () => {
      // Automatically check in or out based on current status
      if (attendanceStatus?.hasCheckedOut) {
        // Already completed for today
        toast({
          title: "Already Completed",
          description: "You have already checked in and out for today.",
        })
      } else if (attendanceStatus?.hasCheckedIn) {
        // Check out
        await handleCheckInLogic(scannedStaffId, "check-out", capturePhotos, "fingerprint")
      } else {
        // Check in
        await handleCheckInLogic(scannedStaffId, "check-in", capturePhotos, "fingerprint")
      }
      
      // Reset for next user
      setTimeout(() => {
        setStaffId("")
        resetAttendanceStatus()
      }, 3000)
    }, 500)
  }

  const handleCloseScanner = async () => {
    console.log("Closing QR scanner...")
    setScannerClosing(true)

    // First, stop all video streams immediately
    const videoElements = document.querySelectorAll('video')
    videoElements.forEach(video => {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind, track.readyState)
          track.stop()
        })
        video.srcObject = null
      }
    })

    // Force increment scanner key to unmount component
    setScannerKey((prev) => prev + 1)

    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 300))

    // Then update state
    setShowScanner(false)
    setStaffId("")
    setShowQRSuccess(false)
    setScannerClosing(false)
    resetAttendanceStatus()
    clearMessages()

    console.log("QR scanner closed successfully")
  }

  // Check if fingerprint verification is required
  const requiresFingerprintVerification = async (staffIdToCheck: string): Promise<{ hasFingerprint: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/biometric/fingerprint/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: staffIdToCheck, tenantId }),
      })
      
      if (response.ok) {
        const { credentials, hasFingerprint } = await response.json()
        return { hasFingerprint: hasFingerprint || (credentials && credentials.length > 0) }
      }
      
      // If 404 or other error, assume no fingerprint
      return { hasFingerprint: false }
    } catch (error) {
      console.error("Error checking fingerprint:", error)
      return { hasFingerprint: false }
    }
  }

  // Simple handlers
  const handleCheckIn = async (type: "check-in" | "check-out") => {
    console.log("=== CHECK-IN DEBUG ===")
    console.log("fingerprintEnabled:", fingerprintEnabled)
    
    // Check if fingerprint is locked by subscription
    const isDev = process.env.NODE_ENV === "development"
    const isInTrialPeriod = subscriptionPlan === "starter" && subscriptionTrialActive
    
    // Fingerprint check: Only available in trial period or enterprise plan
    if (fingerprintEnabled && !isDev && !isInTrialPeriod && subscriptionPlan !== "enterprise") {
      setUpgradeFeature("fingerprintCheckIn")
      setShowUpgradePopup(true)
      return
    }
    
    // Photo verification check: Available in trial, professional, or enterprise
    if (capturePhotos && !isDev) {
      const canUsePhoto = isInTrialPeriod || subscriptionPlan === "professional" || subscriptionPlan === "enterprise"
      if (!canUsePhoto) {
        setUpgradeFeature("photoVerification")
        setShowUpgradePopup(true)
        return
      }
    }
    
    // Only require fingerprint if explicitly enabled in settings
    if (fingerprintEnabled) {
      console.log("Fingerprint verification is enabled - checking registration...")
      const { hasFingerprint } = await requiresFingerprintVerification(staffId)
      console.log("Staff has fingerprint registered:", hasFingerprint)
      
      if (hasFingerprint) {
        // Staff has fingerprint registered - show verification modal
        console.log("Showing fingerprint modal")
        setPendingCheckInType(type)
        setShowFingerprintModal(true)
        return
      } else {
        // Staff has NO fingerprint registered - block them
        console.log("Blocking - no fingerprint registered")
        toast({
          variant: "destructive",
          title: "Fingerprint Not Registered",
          description: "Fingerprint verification is required. Please contact your administrator to register your fingerprint on this device.",
        })
        return
      }
    }
    
    // Fingerprint not required - proceed normally
    console.log("Proceeding with check-in (no fingerprint required)")
    handleCheckInLogic(staffId, type, capturePhotos, activeTab)
  }

  const handleFingerprintSuccess = () => {
    if (pendingCheckInType) {
      handleCheckInLogic(staffId, pendingCheckInType, capturePhotos, activeTab)
      setPendingCheckInType(null)
    }
  }

  const handleTabChange = async (value: string) => {
    // Check if the method is disabled
    if (value === "qr" && !enabledCheckInMethods.qrCode) {
      toast({
        variant: "destructive",
        title: "Method Disabled",
        description: "QR Code check-in has been disabled by your administrator.",
      })
      return
    }
    if (value === "manual" && !enabledCheckInMethods.manualEntry) {
      toast({
        variant: "destructive",
        title: "Method Disabled",
        description: "Manual Entry check-in has been disabled by your administrator.",
      })
      return
    }
    if (value === "face" && !enabledCheckInMethods.faceRecognition) {
      toast({
        variant: "destructive",
        title: "Method Disabled",
        description: "Face Recognition check-in has been disabled by your administrator.",
      })
      return
    }

    if (activeTab === "qr" && value !== "qr") {
      console.log("Leaving QR tab, cleaning up...")
      setScannerClosing(true)

      // Immediately stop video streams
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream
          stream.getTracks().forEach(track => {
            console.log("Stopping track on tab change:", track.kind, track.readyState)
            track.stop()
          })
          video.srcObject = null
        }
      })

      // Force remount scanner component
      setScannerKey((prev) => prev + 1)

      // Reset QR-related state
      setShowScanner(false)
      setShowQRSuccess(false)
      setStaffId("")
      resetAttendanceStatus()
      clearMessages()
      setMessage("")
      setMessageType("")

      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 200))
      setScannerClosing(false)
    }
    setActiveTab(value)
  }

  const handleResetQRSuccess = () => {
    setShowQRSuccess(false)
    setStaffId("")
    resetAttendanceStatus()
    clearMessages()
  }

  // Session management
  React.useEffect(() => {
    const storedTenantId = sessionStorage.getItem("checkInTenantId")
    const storedOrgName = sessionStorage.getItem("checkInOrgName")
    const storedCapturePhotos = sessionStorage.getItem("capturePhotos")
    const storedFingerprintEnabled = sessionStorage.getItem("fingerprintEnabled")
    const storedIsInTrial = sessionStorage.getItem("isInTrial")
    const storedEnabledMethods = sessionStorage.getItem("enabledCheckInMethods")
    const storedTimestamp = sessionStorage.getItem("settingsTimestamp")

    const isStale = storedTimestamp ?
      (getUTCDate().getTime() - parseInt(storedTimestamp)) > (5 * 60 * 1000) : true

    if (storedTenantId && storedOrgName && !isStale) {
      setTenantId(storedTenantId)
      setOrganizationName(storedOrgName)
      setCapturePhotos(storedCapturePhotos === "true")
      setFingerprintEnabled(storedFingerprintEnabled === "true")
      setIsInTrial(storedIsInTrial === "true")
      if (storedEnabledMethods) {
        try {
          const methods = JSON.parse(storedEnabledMethods)
          setEnabledCheckInMethods(methods)
          // Set default active tab to first enabled method
          if (!methods.manualEntry && methods.qrCode) {
            setActiveTab("qr")
          } else if (!methods.manualEntry && !methods.qrCode && methods.faceRecognition) {
            setActiveTab("face")
          }
        } catch (e) {
          console.error("Failed to parse enabled methods:", e)
        }
      }
      setIsUnlocked(true)
    } else if (isStale) {
      sessionStorage.clear()
    }
  }, [])

  // Show toast notifications for success/error
  React.useEffect(() => {
    if (success) {
      toast({
        title: "Success!",
        description: success,
      })
      // Also set local message for manual tab
      if (activeTab === "manual") {
        setMessage(success)
        setMessageType("success")
      }
    }
  }, [success, activeTab, toast])

  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      // Also set local message for manual tab
      if (activeTab === "manual") {
        setMessage(error)
        setMessageType("error")
      }
    }
  }, [error, activeTab, toast])

  // Auto-clear messages and show QR success
  React.useEffect(() => {
    if (success && activeTab === "qr") {
      setShowQRSuccess(true)
      setTimeout(() => {
        clearMessages()
      }, 5000)
    }
  }, [success, activeTab, clearMessages])

  // Scroll to success message when it appears
  React.useEffect(() => {
    if (success && lastAction) {
      setTimeout(() => {
        const successMessage = document.querySelector('[data-success-message]')
        if (successMessage) {
          successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
          })
        }
      }, 200)
    }
  }, [success, lastAction])

  // Cleanup video streams when component unmounts or QR tab is not active
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      console.log("Component unmounting, cleaning up video streams...")
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
          video.srcObject = null
        }
      })
    }
  }, [])

  // Cleanup when QR scanner is not active
  React.useEffect(() => {
    if (activeTab !== "qr" || !showScanner) {
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              console.log("Cleaning up active video track:", track.kind)
              track.stop()
            }
          })
          video.srcObject = null
        }
      })
    }
  }, [activeTab, showScanner])

  // Auto-clear messages after delay
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("")
        setMessageType("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (!isUnlocked) {
    return <UnlockScreen onUnlock={handleUnlock} />
  }

  return (
    <>
      <Toaster />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        onUpgrade={(plan: "professional" | "enterprise") => {
          initiateUpgradePayment({
            plan,
            onSuccess: () => {
              setShowUpgradePopup(false)
            },
            onError: (error) => {
              toast({
                variant: "destructive",
                title: "Payment Error",
                description: error,
              })
            },
          })
        }}
        loading={paymentLoading}
        feature={upgradeFeature === "fingerprintCheckIn" ? "Fingerprint Verification" : "Photo Verification"}
        message={getFeatureGateMessage(upgradeFeature, subscriptionPlan)}
        currentPlan={subscriptionPlan}
        recommendedPlan={getRecommendedPlan(upgradeFeature)}
      />
      
      <BiometricVerificationModal
        open={showFingerprintModal}
        onClose={() => setShowFingerprintModal(false)}
        staffId={staffId}
        tenantId={tenantId}
        onSuccess={handleFingerprintSuccess}
      />
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
        <CheckinHeader organizationName={organizationName} capturePhotos={capturePhotos} isInTrial={isInTrial} />

        {success && lastAction && (
          <SuccessMessage lastAction={lastAction} />
        )}

        <Card className="min-h-[500px] border-0 shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-2xl text-gray-900">Attendance Tracking</CardTitle>
            <CardDescription className="text-gray-600">Choose your preferred check-in method</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px] p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 h-auto">
                <div 
                  className="relative"
                  onClick={() => {
                    if (!enabledCheckInMethods.manualEntry) {
                      toast({
                        variant: "destructive",
                        title: "Method Disabled",
                        description: "Manual Entry has been disabled by your administrator.",
                      })
                    }
                  }}
                >
                  <TabsTrigger 
                    value="manual" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 w-full"
                    disabled={!enabledCheckInMethods.manualEntry}
                  >
                    <User className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Manual</span>
                  </TabsTrigger>
                  {!enabledCheckInMethods.manualEntry && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <div 
                  className="relative"
                  onClick={() => {
                    if (!enabledCheckInMethods.qrCode) {
                      toast({
                        variant: "destructive",
                        title: "Method Disabled",
                        description: "QR Code has been disabled by your administrator.",
                      })
                    }
                  }}
                >
                  <TabsTrigger 
                    value="qr" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 w-full"
                    disabled={!enabledCheckInMethods.qrCode}
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">QR Code</span>
                  </TabsTrigger>
                  {!enabledCheckInMethods.qrCode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <div 
                  className="relative"
                  onClick={() => {
                    if (!enabledCheckInMethods.faceRecognition) {
                      toast({
                        variant: "destructive",
                        title: "Method Disabled",
                        description: "Face Recognition has been disabled by your administrator.",
                      })
                    }
                  }}
                >
                  <TabsTrigger 
                    value="face" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 w-full"
                    disabled={!enabledCheckInMethods.faceRecognition}
                  >
                    <ScanFace className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Face</span>
                  </TabsTrigger>
                  {!enabledCheckInMethods.faceRecognition && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
              </TabsList>

              <TabsContent value="manual" className="space-y-4" data-tab="manual">
                <ManualEntryTab
                  staffId={staffId}
                  setStaffId={setStaffId}
                  loading={loading}
                  error={error}
                  message={message}
                  messageType={messageType}
                  capturePhotos={capturePhotos}
                  attendanceStatus={attendanceStatus}
                  statusLoading={statusLoading}
                  onCheckIn={handleCheckIn}
                  onCheckAttendanceStatus={checkAttendanceStatus}
                  onClearMessage={() => {
                    setMessage("")
                    setMessageType("")
                  }}
                />
              </TabsContent>

              <TabsContent value="face" className="space-y-4">
                {activeTab === "face" && (
                  <FaceRecognition mode="authenticate" onScan={handleBiometricScan} />
                )}
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <QRScannerTab
                  showScanner={showScanner}
                  staffId={staffId}
                  scannerKey={scannerKey}
                  loading={loading}
                  capturePhotos={capturePhotos}
                  attendanceStatus={attendanceStatus}
                  statusLoading={statusLoading}
                  showQRSuccess={showQRSuccess}
                  scannerClosing={scannerClosing}
                  lastAction={lastAction}
                  onOpenScanner={() => setShowScanner(true)}
                  onQRScan={handleQRScan}
                  onCloseScanner={handleCloseScanner}
                  onCheckIn={handleCheckIn}
                  onResetQRSuccess={handleResetQRSuccess}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>
            Don't have your Staff ID or QR code?{" "}
            <span className="text-gray-700 font-medium">
              Contact your administrator
            </span>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}