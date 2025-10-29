"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, X, Zap, RotateCcw } from "lucide-react"

interface EnhancedQRScannerProps {
  onScan: (result: string) => void
  onClose?: () => void
}

export function EnhancedQRScanner({ onScan, onClose }: EnhancedQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [cameras, setCameras] = useState<any[]>([])
  const [scannerReady, setScannerReady] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = useRef(`qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).current
  const mountedRef = useRef(true)
  const cleanupInProgressRef = useRef(false)
  const lastScanRef = useRef("")
  const lastScanTimeRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    initializeScanner()

    return () => {
      console.log("QR Scanner: Component unmounting, cleaning up...")
      mountedRef.current = false
      
      // Immediate cleanup without waiting
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState()
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            scannerRef.current.stop().catch(console.warn)
          }
          scannerRef.current.clear().catch(console.warn)
        } catch (err) {
          console.warn("Unmount cleanup error:", err)
        }
      }
      
      // Force stop all video streams immediately
      setTimeout(() => {
        const videoElements = document.querySelectorAll('video')
        videoElements.forEach(video => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            video.srcObject = null
          }
        })
      }, 0)
      
      cleanup()
    }
  }, [])

  const cleanup = async () => {
    if (cleanupInProgressRef.current) return
    cleanupInProgressRef.current = true

    console.log("QR Scanner: Starting cleanup...")

    try {
      // First, stop the Html5Qrcode scanner
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState()
          console.log("QR Scanner state:", state)
          
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            console.log("Stopping QR scanner...")
            await scannerRef.current.stop()
          }
          
          console.log("Clearing QR scanner...")
          await scannerRef.current.clear()
        } catch (err) {
          console.warn("Scanner cleanup error:", err)
        }
        scannerRef.current = null
      }
      
      // Aggressively stop all video streams
      console.log("Stopping all video streams...")
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach((video, index) => {
        console.log(`Processing video element ${index}:`, video)
        try {
          // Pause the video
          video.pause()
          
          // Stop all tracks from srcObject
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream
            console.log(`Video ${index} has ${stream.getTracks().length} tracks`)
            
            stream.getTracks().forEach((track, trackIndex) => {
              console.log(`Stopping track ${trackIndex} (${track.kind}):`, track.readyState)
              try {
                track.stop()
                console.log(`Track ${trackIndex} stopped successfully`)
              } catch (e) {
                console.warn(`Error stopping track ${trackIndex}:`, e)
              }
            })
            
            // Clear the srcObject
            video.srcObject = null
            console.log(`Video ${index} srcObject cleared`)
          }
          
          // Remove src attribute if present
          if (video.src) {
            video.removeAttribute('src')
            video.load() // Reset the video element
          }
        } catch (e) {
          console.warn(`Error cleaning up video element ${index}:`, e)
        }
      })
      
      // Also try to get and stop all media streams directly
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // This is a bit of a hack, but we'll try to enumerate and stop any active streams
          console.log("Attempting to stop any remaining media streams...")
        }
      } catch (e) {
        console.warn("Error accessing media devices:", e)
      }
      
      setIsScanning(false)
      setScannerReady(false)
      console.log("QR Scanner cleanup completed")
    } catch (err) {
      console.warn("General cleanup error:", err)
    } finally {
      cleanupInProgressRef.current = false
    }
  }

  const initializeScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!mountedRef.current) return

      setCameras(devices)

      if (devices.length === 0) {
        setError("No cameras found on this device")
        return
      }

      // Clear any existing scanner
      await cleanup()

      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        if (mountedRef.current) {
          scannerRef.current = new Html5Qrcode(elementId)
          setScannerReady(true)
          startScanning(devices)
        }
      }, 100)
    } catch (err) {
      console.error("Error initializing scanner:", err)
      setError("Failed to access camera. Please check permissions.")
    }
  }

  const startScanning = async (devices: any[]) => {
    if (!scannerRef.current || !mountedRef.current) return

    try {
      setIsScanning(true)
      setError("")

      const cameraId =
        devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
        )?.id || devices[0].id

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await scannerRef.current.start(
        cameraId,
        config,
        async (decodedText) => {
          if (!mountedRef.current) return
          
          // Prevent duplicate scans within 2 seconds
          const now = Date.now()
          if (decodedText === lastScanRef.current && (now - lastScanTimeRef.current) < 2000) {
            console.log("Duplicate scan ignored")
            return
          }
          
          console.log("QR Code detected:", decodedText)
          
          // Update last scan info
          lastScanRef.current = decodedText
          lastScanTimeRef.current = now
          
          // Stop scanning immediately after successful scan
          await cleanup()
          
          // Call parent handler
          onScan(decodedText)
        },
        (error) => {
          if (!error.includes("NotFoundException")) {
            console.warn("QR scan error:", error)
          }
        },
      )
    } catch (err) {
      console.error("Error starting scanner:", err)
      setError("Failed to start camera. Please ensure camera permissions are granted.")
      setIsScanning(false)
    }
  }

  const handleClose = async () => {
    if (isClosing) return // Prevent multiple clicks
    
    console.log("QR Scanner: Close button clicked")
    setIsClosing(true)
    
    // Immediately call parent close to update UI
    onClose?.()
    
    // Then cleanup in background
    try {
      await cleanup()
    } catch (err) {
      console.error("Error during close cleanup:", err)
    }
  }

  const handleRestart = async () => {
    await cleanup()
    setTimeout(() => {
      if (mountedRef.current) {
        initializeScanner()
      }
    }, 300)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-xl shadow-lg p-6 border-2 border-accent-teal/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary-dark flex items-center gap-2">
            <div className="p-2 bg-accent-teal/10 rounded-lg">
              <Camera className="w-5 h-5 text-accent-teal" />
            </div>
            QR Code Scanner
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose} 
            disabled={isClosing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <div
            id={elementId}
            className="w-full rounded-lg overflow-hidden bg-gray-100"
            style={{ minHeight: "300px" }}
          />

          {!isScanning && !error && !scannerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent-teal/10 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent-teal animate-pulse" />
                </div>
                <p className="text-gray-600">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-4 text-center space-y-3">
          <p className="text-gray-600 text-sm">Position the QR code within the scanning area</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRestart}
              className="flex-1 border-accent-teal/30 text-accent-teal hover:bg-accent-teal/5"
              disabled={!isScanning}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isClosing}
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {isClosing ? "Closing..." : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
