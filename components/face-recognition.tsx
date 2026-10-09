"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle, AlertTriangle, X, User } from "lucide-react"

interface FaceRecognitionProps {
  /** Called with the recognized staff ID and, when authenticating, the server's biometric proof */
  onScan: (staffId: string, biometricProof?: string) => void
  onClose?: () => void
  mode: "register" | "authenticate"
  staffId?: string
  /** Required in register mode */
  enrollToken?: string
  /** Required in authenticate mode */
  checkInToken?: string
}

export function FaceRecognition({ onScan, onClose, mode, staffId, enrollToken, checkInToken }: FaceRecognitionProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // The <video> element only exists while scanning, so attach the stream once both are ready
  useEffect(() => {
    const video = videoRef.current
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream
      video.play().catch(() => {
        // autoplay can be interrupted if the camera is stopped quickly; nothing to do
      })
    }
  }, [stream, isScanning])

  // Release the camera when the stream is replaced or the component unmounts
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  const startCamera = async () => {
    setError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot access the camera. Use Chrome, Edge, Firefox or Safari over http://localhost or HTTPS.")
      return
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })
      setStream(mediaStream)
      setIsScanning(true)
    } catch (err: any) {
      console.error("Camera error:", err)
      setError(
        err?.name === "NotAllowedError"
          ? "Camera access was blocked. Allow camera access for this site in your browser settings, then try again."
          : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : err?.name === "NotReadableError"
              ? "The camera is in use by another app. Close it and try again."
              : "Could not start the camera."
      )
    }
  }

  const stopCamera = () => {
    setStream(null)
    setIsScanning(false)
  }

  const captureImage = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!video || !canvas || !context) return

    // The first frames arrive a moment after the camera starts
    if (!video.videoWidth || !video.videoHeight) {
      setError("The camera is still starting. Wait a second and try again.")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    // Send the unmodified frame; brightness/contrast changes reduce recognition accuracy
    const faceImage = canvas.toDataURL("image/jpeg", 0.9).split(",")[1] // strip the data: prefix

    setProcessing(true)
    setError("")
    try {
      const response = await fetch(mode === "register" ? "/api/biometric/face/register" : "/api/biometric/face/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(mode === "authenticate" ? { "x-checkin-token": checkInToken || "" } : {}),
        },
        body: JSON.stringify(mode === "register" ? { enrollToken, faceImage } : { faceImage }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || (mode === "register" ? "Failed to register face" : "Face not recognized"))
      }

      // Only switch the camera off once it worked; on failure it stays on so the person can retry
      stopCamera()
      setSuccess(true)
      setTimeout(() => {
        if (mode === "register") onScan(staffId || "")
        else onScan(data.staffId, data.biometricProof)
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Face recognition failed")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="glass-card shadow-xl border-2 border-blue-200">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <CardTitle className="text-xl text-primary-navy">
            {mode === "register" ? "Register Face" : "Face Recognition"}
          </CardTitle>
          <CardDescription>
            {mode === "register"
              ? "Position your face in the camera to register"
              : "Look at the camera to authenticate"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            {!isScanning && !success ? (
              <div className="w-48 h-36 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            ) : success ? (
              <div className="w-48 h-36 mx-auto bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-200">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            ) : (
              <div className="relative w-full max-w-sm mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-sm aspect-[4/3] mx-auto bg-black rounded-lg object-cover -scale-x-100"
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4">
              {isScanning && !success && <p className="text-blue-600 font-medium">Position your face in the frame</p>}
              {success && (
                <p className="text-green-600 font-medium">
                  Face {mode === "register" ? "registered" : "recognized"} successfully!
                </p>
              )}
              {!isScanning && !success && <p className="text-gray-600">Ready to start face {mode}</p>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {!isScanning && !success && (
              <Button
                onClick={startCamera}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            )}

            {isScanning && !success && (
              <>
                <Button
                  onClick={captureImage}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  {processing ? (mode === "register" ? "Registering..." : "Checking...") : "Capture"}
                </Button>
                <Button variant="outline" onClick={stopCamera} disabled={processing} className="flex-1">
                  Cancel
                </Button>
              </>
            )}

            {onClose && success && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
