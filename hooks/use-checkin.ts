"use client"

import { useState, useCallback } from "react"

interface AttendanceStatus {
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime?: string
  checkOutTime?: string
  isLate?: boolean
  isEarly?: boolean
}

interface LastAction {
  name: string
  type: string
  time: string
  isLate?: boolean
  isEarly?: boolean
}

export function useCheckin(tenantId: string) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)

  const checkAttendanceStatus = useCallback(async (staffId: string) => {
    if (!staffId.trim() || !tenantId) return

    setStatusLoading(true)
    try {
      const response = await fetch("/api/attendance/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: staffId.trim().toUpperCase(),
          tenantId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAttendanceStatus(data.status)
      } else {
        setAttendanceStatus(null)
      }
    } catch (err) {
      console.error("Status check error:", err)
      setAttendanceStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }, [tenantId])

  const capturePhotoSilently = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      let stream: MediaStream | null = null

      const cleanup = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }

      navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      }).then((mediaStream) => {
        stream = mediaStream
        const video = document.createElement('video')
        video.srcObject = mediaStream
        video.autoplay = true
        video.playsInline = true
        video.muted = true

        video.onloadedmetadata = () => {
          setTimeout(() => {
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (context) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              context.drawImage(video, 0, 0)

              const imageData = canvas.toDataURL('image/jpeg', 0.7)
              const base64 = imageData.split(',')[1]

              cleanup()
              resolve(base64)
            } else {
              cleanup()
              resolve(null)
            }
          }, 2000)
        }
      }).catch((err) => {
        console.error('Camera access failed:', err)
        cleanup()
        resolve(null)
      })
    })
  }, [])

  const processCheckIn = useCallback(async (
    staffId: string,
    type: "check-in" | "check-out",
    photo?: string,
    method?: string
  ) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: staffId.trim().toUpperCase(),
          type,
          tenantId,
          photo,
          method: method || "manual",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Staff ID not found. Please check your ID and try again.")
        } else if (response.status === 403) {
          throw new Error("Staff account is inactive. Please contact your administrator.")
        } else if (response.status === 400) {
          if (data.error?.includes("already checked in")) {
            await checkAttendanceStatus(staffId.trim().toUpperCase())
            throw new Error("You have already checked in today. You can now check out.")
          } else if (data.error?.includes("already checked out")) {
            await checkAttendanceStatus(staffId.trim().toUpperCase())
            throw new Error("You have already checked out today. See you tomorrow!")
          } else if (data.error?.includes("No check-in record found")) {
            throw new Error("Please check in first before checking out.")
          }
          throw new Error(data.error || "Invalid request. Please try again.")
        } else {
          throw new Error(data.error || `${type} failed`)
        }
      }

      const staffName = data.staff || "Staff Member"

      setLastAction({
        name: staffName,
        type,
        time: new Date().toLocaleTimeString(),
        isLate: data.isLate,
        isEarly: data.isEarly,
      })

      setSuccess(`${staffName} successfully ${type === "check-in" ? "checked in" : "checked out"}!`)

      // Update attendance status after successful action
      if (type === "check-in") {
        setAttendanceStatus({
          hasCheckedIn: true,
          hasCheckedOut: false,
          checkInTime: new Date().toISOString(),
          isLate: data.isLate,
        })
      } else {
        setAttendanceStatus(prev => prev ? {
          ...prev,
          hasCheckedOut: true,
          checkOutTime: new Date().toISOString(),
          isEarly: data.isEarly,
        } : null)
      }

      return true
    } catch (err) {
      console.error("Check-in error:", err)
      setError(err instanceof Error ? err.message : `${type} failed. Please try again.`)
      return false
    } finally {
      setLoading(false)
    }
  }, [tenantId, checkAttendanceStatus])

  const handleCheckIn = useCallback(async (
    staffId: string,
    type: "check-in" | "check-out",
    capturePhotos: boolean,
    method?: string
  ) => {
    if (!staffId.trim()) {
      setError("Please enter your Staff ID")
      return false
    }

    if (!tenantId) {
      setError("System not properly initialized. Please refresh and try again.")
      return false
    }

    // If photo capture is enabled, capture silently
    if (capturePhotos) {
      console.log("Photo capture enabled, starting silent capture for:", type)
      setLoading(true)
      setError("")
      setSuccess("📸 Photo verification in progress. Please remain still and face the camera directly...")

      try {
        const capturedPhoto = await capturePhotoSilently()
        if (capturedPhoto) {
          console.log("Photo captured successfully, length:", capturedPhoto.length)
          return await processCheckIn(staffId, type, capturedPhoto, method)
        } else {
          console.log("Photo capture failed - no photo returned")
          throw new Error("Photo capture failed. Please try again.")
        }
      } catch (err) {
        console.error("Photo capture error:", err)
        setError("Photo capture required. Please face the camera and try again.")
        setLoading(false)
        return false
      }
    }

    // Process check-in normally (without photo)
    return await processCheckIn(staffId, type, undefined, method)
  }, [tenantId, capturePhotoSilently, processCheckIn])

  const clearMessages = useCallback(() => {
    setSuccess("")
    setError("")
    setLastAction(null)
  }, [])

  const resetAttendanceStatus = useCallback(() => {
    setAttendanceStatus(null)
  }, [])

  return {
    loading,
    success,
    error,
    attendanceStatus,
    statusLoading,
    lastAction,
    checkAttendanceStatus,
    handleCheckIn,
    clearMessages,
    resetAttendanceStatus,
  }
}