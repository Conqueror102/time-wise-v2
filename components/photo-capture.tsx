"use client"

import { useRef, useEffect, useState } from "react"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoCaptureProps {
  onCapture: (photoBase64: string) => void
  onSkip?: () => void
  autoCapture?: boolean
  countdown?: number
}

export function PhotoCapture({ onCapture, onSkip, autoCapture = true, countdown = 3 }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [counter, setCounter] = useState(countdown)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (autoCapture && stream && counter > 0) {
      const timer = setTimeout(() => {
        setCounter(counter - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (autoCapture && counter === 0 && !capturing) {
      capturePhoto()
    }
  }, [counter, stream, autoCapture, capturing])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Camera error:", err)
      // If camera fails, skip photo capture
      onSkip?.()
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || capturing) return

    setCapturing(true)
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL("image/jpeg", 0.7)
    const base64 = imageData.split(",")[1]

    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    onCapture(base64)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Verification Photo
          </h3>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />

          {autoCapture && counter > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">{counter}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 text-center mt-4">
          {autoCapture
            ? "Photo will be captured automatically..."
            : "Position yourself in the frame"}
        </p>

        {!autoCapture && (
          <div className="flex gap-2 mt-4">
            <Button onClick={capturePhoto} className="flex-1" disabled={capturing}>
              Capture Photo
            </Button>
            {onSkip && (
              <Button onClick={onSkip} variant="outline" className="flex-1">
                Skip
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
