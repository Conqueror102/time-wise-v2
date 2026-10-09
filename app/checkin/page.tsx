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
import { HandsFreeFace } from "@/components/checkin/hands-free-face"
import { UnlockScreen } from "@/components/checkin/unlock-screen"
import { CheckinHeader } from "@/components/checkin/checkin-header"
import { SuccessMessage } from "@/components/checkin/success-message"
import { ManualEntryTab } from "@/components/checkin/manual-entry-tab"
import { QRScannerTab } from "@/components/checkin/qr-scanner-tab"
import { useCheckin } from "@/hooks/use-checkin"
import { useToast } from "@/hooks/use-toast"

export default function CheckInPage() {
  // Core state
  const [staffId, setStaffId] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")
  const [scannerKey, setScannerKey] = useState(0)
  // The scanned QR text; the server checks its signature on QR check-ins
  const [qrPayload, setQrPayload] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [checkInToken, setCheckInToken] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [capturePhotos, setCapturePhotos] = useState(false)
  const [showQRSuccess, setShowQRSuccess] = useState(false)
  const [scannerClosing, setScannerClosing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [enabledCheckInMethods, setEnabledCheckInMethods] = useState({
    qrCode: true,
    manualEntry: true,
    faceRecognition: false,
  })

  // Toast notifications
  const { toast } = useToast()
  

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
  } = useCheckin(checkInToken)

  const availableMethods = [
    { value: "manual", label: "Manual", hint: "Enter your Staff ID", Icon: User, enabled: enabledCheckInMethods.manualEntry },
    { value: "qr", label: "QR Code", hint: "Scan your QR code", Icon: QrCode, enabled: enabledCheckInMethods.qrCode },
    { value: "face", label: "Face", hint: "Look at the camera to check in", Icon: ScanFace, enabled: enabledCheckInMethods.faceRecognition },
  ].filter((m) => m.enabled)

  // Enable the configured methods and open the first one that is allowed
  const applyEnabledMethods = (methods: { qrCode: boolean; manualEntry: boolean; faceRecognition: boolean }) => {
    setEnabledCheckInMethods(methods)
    if (methods.manualEntry) setActiveTab("manual")
    else if (methods.qrCode) setActiveTab("qr")
    else if (methods.faceRecognition) setActiveTab("face")
  }

  // Simplified handlers
  const handleUnlock = (data: {
    checkInToken: string;
    tenantId: string;
    organizationName: string;
    capturePhotos: boolean;
    enabledCheckInMethods?: {
      qrCode: boolean;
      manualEntry: boolean;
      faceRecognition: boolean;
    }
  }) => {
    setCheckInToken(data.checkInToken)
    setOrganizationName(data.organizationName)
    setCapturePhotos(!!data.capturePhotos)
    applyEnabledMethods(data.enabledCheckInMethods || {
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
      setQrPayload(scannedId.trim())
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
    setQrPayload("")
    setShowQRSuccess(false)
    setScannerClosing(false)
    resetAttendanceStatus()
    clearMessages()

    console.log("QR scanner closed successfully")
  }

  const handleCheckIn = async (
    type: "check-in" | "check-out",
    options: { staffId?: string; method?: string; proofs?: string[]; photo?: string } = {}
  ): Promise<boolean | "pending"> => {
    const id = options.staffId ?? staffId
    const method = options.method ?? activeTab
    const proofs = options.proofs ?? []
    const photo = options.photo
    const qrData = method === "qr" ? qrPayload : undefined

    return await handleCheckInLogic(id, type, capturePhotos, method, proofs, photo, qrData)
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
      setQrPayload("")
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
    setQrPayload("")
    resetAttendanceStatus()
    clearMessages()
  }

  // Session management
  React.useEffect(() => {
    const storedToken = sessionStorage.getItem("checkInToken")
    const storedOrgName = sessionStorage.getItem("checkInOrgName")
    const storedCapturePhotos = sessionStorage.getItem("capturePhotos")
    const storedEnabledMethods = sessionStorage.getItem("enabledCheckInMethods")
    const storedTimestamp = sessionStorage.getItem("settingsTimestamp")

    const isStale = storedTimestamp ?
      (getUTCDate().getTime() - parseInt(storedTimestamp)) > (5 * 60 * 1000) : true

    if (storedToken && storedOrgName && !isStale) {
      setCheckInToken(storedToken)
      setOrganizationName(storedOrgName)
      setCapturePhotos(storedCapturePhotos === "true")
      if (storedEnabledMethods) {
        try {
          applyEnabledMethods(JSON.parse(storedEnabledMethods))
        } catch (e) {
          console.error("Failed to parse enabled methods:", e)
        }
      }
      setIsUnlocked(true)
    } else {
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
        <CheckinHeader organizationName={organizationName} capturePhotos={capturePhotos} />

        {success && lastAction && (
          <SuccessMessage lastAction={lastAction} />
        )}

        <Card className="min-h-[500px] border-0 shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-2xl text-gray-900">Attendance Tracking</CardTitle>
            <CardDescription className="text-gray-600">
              {availableMethods.length > 1 ? "Choose your preferred check-in method" : availableMethods[0]?.hint}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px] p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Only the methods the admin allows; no tab bar when there is just one */}
              {availableMethods.length > 1 && (
                <TabsList
                  className={`grid w-full bg-gray-100 p-1 h-auto ${availableMethods.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
                >
                  {availableMethods.map(({ value, label, Icon }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3 w-full"
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}

              {availableMethods.length === 0 && (
                <div className="text-center py-16 text-gray-600">
                  <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">No check-in methods are available</p>
                  <p className="text-sm mt-1">Ask your administrator to enable one in Settings → Check-In Methods.</p>
                </div>
              )}

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
                  <HandsFreeFace
                    checkInToken={checkInToken}
                    onCheckIn={({ staffId: id, type, proof, photo }) =>
                      handleCheckIn(type, { staffId: id, method: "face", proofs: [proof], photo })
                    }
                  />
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