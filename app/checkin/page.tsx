"use client"

/**
 * Public Check-In/Out Interface - Modular Version
 * Can be used on kiosk or staff mobile devices
 */

import { useState } from "react"
import React from "react"
import { User, QrCode, Fingerprint, ScanFace } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FingerprintScanner } from "@/components/fingerprint-scanner"
import { FaceRecognition } from "@/components/face-recognition"
import { UnlockScreen } from "@/components/checkin/unlock-screen"
import { CheckinHeader } from "@/components/checkin/checkin-header"
import { SuccessMessage } from "@/components/checkin/success-message"
import { ManualEntryTab } from "@/components/checkin/manual-entry-tab"
import { QRScannerTab } from "@/components/checkin/qr-scanner-tab"
import { useCheckin } from "@/hooks/use-checkin"

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
  const [showQRSuccess, setShowQRSuccess] = useState(false)
  const [scannerClosing, setScannerClosing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

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
  const handleUnlock = (data: { tenantId: string; organizationName: string; capturePhotos: boolean }) => {
    setTenantId(data.tenantId)
    setOrganizationName(data.organizationName)
    setCapturePhotos(data.capturePhotos)
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
        setMessage("Invalid QR code: No staff ID found")
        setMessageType("error")
        setShowScanner(false)
        setScannerKey((prev) => prev + 1)
        return
      }

      // Clean up staff ID
      const finalStaffId = decodedStaffId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

      if (!finalStaffId || finalStaffId.length === 0) {
        setMessage("Invalid QR code: Invalid staff ID format")
        setMessageType("error")
        setShowScanner(false)
        setScannerKey((prev) => prev + 1)
        return
      }

      // Update state
      setStaffId(finalStaffId)
      setShowScanner(false)
      setScannerKey((prev) => prev + 1)
      setMessage("QR code scanned successfully!")
      setMessageType("success")

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
      setMessage("Failed to process QR code. Please try again.")
      setMessageType("error")
      setShowScanner(false)
      setScannerKey((prev) => prev + 1)
    }
  }

  const handleBiometricScan = async (scannedStaffId: string) => {
    setStaffId(scannedStaffId)
    setActiveTab("manual")
    await checkAttendanceStatus(scannedStaffId)

    // Scroll to manual tab after biometric scan
    setTimeout(() => {
      const manualTab = document.querySelector('[data-tab="manual"]')
      if (manualTab) {
        manualTab.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        })
      }
    }, 300)
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

  // Simple handlers
  const handleCheckIn = (type: "check-in" | "check-out") => {
    handleCheckInLogic(staffId, type, capturePhotos, activeTab)
  }

  const handleTabChange = async (value: string) => {
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
    const storedTimestamp = sessionStorage.getItem("settingsTimestamp")

    const isStale = storedTimestamp ?
      (Date.now() - parseInt(storedTimestamp)) > (5 * 60 * 1000) : true

    if (storedTenantId && storedOrgName && !isStale) {
      setTenantId(storedTenantId)
      setOrganizationName(storedOrgName)
      setCapturePhotos(storedCapturePhotos === "true")
      setIsUnlocked(true)
    } else if (isStale) {
      sessionStorage.clear()
    }
  }, [])

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <CheckinHeader organizationName={organizationName} capturePhotos={capturePhotos} />

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
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 h-auto">
                <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3">
                  <User className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Manual</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3">
                  <QrCode className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">QR Code</span>
                </TabsTrigger>
                <TabsTrigger value="fingerprint" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3">
                  <Fingerprint className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Fingerprint</span>
                </TabsTrigger>
                <TabsTrigger value="face" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3">
                  <ScanFace className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Face</span>
                </TabsTrigger>
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

              <TabsContent value="fingerprint" className="space-y-4">
                {activeTab === "fingerprint" && (
                  <FingerprintScanner mode="authenticate" onScan={handleBiometricScan} />
                )}
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
            Want to use fingerprint or face recognition?{" "}
            <a href="/register-biometric" className="text-blue-600 hover:underline font-medium">
              Register your biometrics
            </a>
          </p>
          <p>
            Don't have your Staff ID?{" "}
            <a href="/dashboard/staff" className="text-blue-600 hover:underline">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}