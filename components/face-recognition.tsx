"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle, AlertTriangle, X, User } from "lucide-react"

interface FaceRecognitionProps {
  onScan: (faceData: string) => void
  onClose?: () => void
  mode: "register" | "authenticate"
  staffId?: string
}

export function FaceRecognition({ onScan, onClose, mode, staffId }: FaceRecognitionProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          // Request better lighting conditions
          advanced: [
            { exposureMode: "continuous" },
            { whiteBalanceMode: "continuous" },
            { focusMode: "continuous" }
          ]
        },
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsScanning(true)
      setError("")
    } catch (err: any) {
      setError("Camera access denied. Please allow camera permissions.")
      console.error("Camera error:", err)
    }
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw the video frame
    context.drawImage(video, 0, 0)

    // Enhance brightness and contrast
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Adjust brightness and contrast
    const brightness = 20 // Increase brightness
    const contrast = 30   // Increase contrast
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness and contrast to RGB channels
      data[i] = factor * (data[i] - 128) + 128 + brightness     // Red
      data[i + 1] = factor * (data[i + 1] - 128) + 128 + brightness // Green
      data[i + 2] = factor * (data[i + 2] - 128) + 128 + brightness // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }
    
    // Put the enhanced image back
    context.putImageData(imageData, 0, 0)

    // Convert to base64
    const enhancedImageData = canvas.toDataURL("image/jpeg", 0.9)
    const faceImage = enhancedImageData.split(",")[1] // Remove data:image/jpeg;base64, prefix

    try {
      if (mode === "register") {
        // Register face
        const response = await fetch("/api/biometric/face/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId,
            faceImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to register face")
        }

        setSuccess(true)
        setTimeout(() => {
          onScan(staffId || "")
        }, 1000)
      } else {
        // Authenticate face
        const response = await fetch("/api/biometric/face/authenticate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faceImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Face not recognized")
        }

        const data = await response.json()
        
        setSuccess(true)
        setTimeout(() => {
          onScan(data.staffId)
        }, 1000)
      }
    } catch (err: any) {
      setError(err.message || "Face recognition failed")
      setSuccess(false)
    } finally {
      // Stop camera
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
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
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-48 h-36 mx-auto bg-black rounded-lg object-cover"
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  Capture
                </Button>
                <Button variant="outline" onClick={stopCamera} className="flex-1">
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
