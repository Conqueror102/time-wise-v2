"use client"

import { QrCode, Clock, Loader2, Camera, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnhancedQRScanner } from "@/components/enhanced-qr-scanner"

interface AttendanceStatus {
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime?: string
  checkOutTime?: string
  isLate?: boolean
  isEarly?: boolean
}

interface QRScannerTabProps {
  showScanner: boolean
  staffId: string
  scannerKey: number
  loading: boolean
  capturePhotos: boolean
  attendanceStatus: AttendanceStatus | null
  statusLoading: boolean
  showQRSuccess: boolean
  scannerClosing?: boolean
  lastAction: {
    name: string
    type: string
    time: string
    isLate?: boolean
    isEarly?: boolean
  } | null
  onOpenScanner: () => void
  onQRScan: (result: string) => void
  onCloseScanner: () => void
  onCheckIn: (type: "check-in" | "check-out") => void
  onResetQRSuccess: () => void
}

export function QRScannerTab({
  showScanner,
  staffId,
  scannerKey,
  loading,
  capturePhotos,
  attendanceStatus,
  statusLoading,
  showQRSuccess,
  scannerClosing = false,
  lastAction,
  onOpenScanner,
  onQRScan,
  onCloseScanner,
  onCheckIn,
  onResetQRSuccess,
}: QRScannerTabProps) {
  if (showQRSuccess) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Ready to scan another QR code
        </p>
        <Button
          onClick={onResetQRSuccess}
          variant="outline"
          className="w-full"
        >
          Scan Another QR Code
        </Button>
      </div>
    )
  }

  if (!showScanner && !staffId) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-base font-medium text-gray-900 mb-2">
          QR Code Scanner
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Position your QR code in front of the camera
        </p>
        <Button 
          onClick={() => {
            onOpenScanner()
            // Scroll camera area into view when opened
            setTimeout(() => {
              const qrSection = document.querySelector('[data-qr-scanner]')
              if (qrSection) {
                qrSection.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                  inline: "nearest"
                })
              }
            }, 300) // Small delay to allow camera to initialize
          }} 
          variant="outline"
        >
          Open Camera
        </Button>
        <p className="text-xs text-gray-500 mt-3">
          Camera access required for QR scanning
        </p>
      </div>
    )
  }

  if (showScanner && !staffId) {
    if (scannerClosing) {
      return (
        <div className="space-y-4 text-center py-8" data-qr-scanner>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600">Closing camera...</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4" data-qr-scanner>
        <EnhancedQRScanner
          key={scannerKey}
          onScan={onQRScan}
          onClose={onCloseScanner}
        />
      </div>
    )
  }

  if (staffId) {
    return (
      <div className="space-y-3">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
          <p className="text-sm text-green-700 font-medium mb-1">Scanned ID:</p>
          <p className="font-mono font-bold text-xl text-green-800">{staffId}</p>
        </div>

        {/* Photo Verification Notice for QR */}
        {capturePhotos && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Photo Verification Required
                </h4>
                <p className="text-sm text-red-700">
                  Position yourself clearly in front of the camera for mandatory photo verification. 
                  <span className="font-semibold">Attendance will not be recorded without successful verification.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Action Buttons */}
        <div data-qr-actions>
          {statusLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Checking status...</span>
            </div>
          ) : attendanceStatus?.hasCheckedOut ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">All done for today!</p>
            </div>
          ) : attendanceStatus?.hasCheckedIn ? (
            // Only show check-out button
            <Button
              data-action="check-out"
              onClick={() => onCheckIn("check-out")}
              disabled={loading}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Check Out
                </>
              )}
            </Button>
          ) : attendanceStatus && !attendanceStatus.hasCheckedIn ? (
            // Only show check-in button
            <Button
              data-action="check-in"
              onClick={() => onCheckIn("check-in")}
              disabled={loading}
              className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          ) : (
            // Show both buttons when status is unknown
            <div className="grid grid-cols-2 gap-3">
              <Button
                data-action="check-in"
                onClick={() => onCheckIn("check-in")}
                disabled={loading}
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>
              <Button
                data-action="check-out"
                onClick={() => onCheckIn("check-out")}
                disabled={loading}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Check Out
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={() => {
            onResetQRSuccess()
          }}
          variant="outline"
          className="w-full"
        >
          Scan Another QR Code
        </Button>
      </div>
    )
  }

  return null
}