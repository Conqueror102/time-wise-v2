"use client"

/**
 * Hands-free face check-in for the kiosk.
 *
 * The camera stays on and a frame is checked every second or two. To avoid
 * recording people who just walk past, a match only counts when the face is
 * close to the camera and the same person is seen in consecutive scans.
 * Check-in then happens automatically; check-out needs a tap, because an
 * accidental check-out would silently corrupt someone's day.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, CheckCircle2, Loader2, LogOut, ScanFace, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"

// Face width as a share of the frame width: ~15% is roughly arm's length from a webcam
const MIN_FACE_WIDTH_RATIO = 0.15
// Consecutive scans that must recognise the same person before acting
const REQUIRED_MATCHES = 2
const SCAN_INTERVAL_MS = 1200
const IDLE_SCAN_INTERVAL_MS = 2000
const RESULT_DISPLAY_MS = 4000
const CHECKOUT_PROMPT_MS = 10000
// After someone is handled, ignore them for this long
const COOLDOWN_MS = 60000
const FRAME_WIDTH = 640

type CheckInOutcome = boolean | "pending"

interface HandsFreeFaceProps {
  checkInToken: string
  /** Performs the check-in/out; returns "pending" when another step takes over */
  onCheckIn: (args: {
    staffId: string
    type: "check-in" | "check-out"
    proof: string
    photo: string
  }) => Promise<CheckInOutcome>
}

type Phase =
  | { kind: "idle" }
  | { kind: "scanning"; hint: string }
  | { kind: "working"; name: string }
  | { kind: "confirm-checkout"; staffId: string; name: string; proof: string; photo: string }
  | { kind: "result"; tone: "success" | "info" | "error"; title: string; detail?: string }

export function HandsFreeFace({ checkInToken, onCheckIn }: HandsFreeFaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState("")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const inFlight = useRef(false)
  const streak = useRef<{ staffId: string; count: number }>({ staffId: "", count: 0 })
  const cooldowns = useRef(new Map<string, number>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startCamera = useCallback(async () => {
    setCameraError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser cannot access the camera. Open the kiosk over http://localhost or HTTPS.")
      return
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      })
      setStream(media)
      setPhase({ kind: "scanning", hint: "Look at the camera to check in" })
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera access was blocked. Allow the camera for this site in your browser settings."
          : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : err?.name === "NotReadableError"
              ? "The camera is in use by another app."
              : "Could not start the camera."
      )
    }
  }, [])

  // Start automatically when the tab opens
  useEffect(() => {
    startCamera()
  }, [startCamera])

  // Attach the stream once the <video> element exists; release the camera on unmount
  useEffect(() => {
    const video = videoRef.current
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    }
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const showResult = useCallback((result: Omit<Extract<Phase, { kind: "result" }>, "kind">, ms = RESULT_DISPLAY_MS) => {
    setPhase({ kind: "result", ...result })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPhase({ kind: "scanning", hint: "Look at the camera to check in" }), ms)
  }, [])

  const captureFrame = (): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!video || !canvas || !context || !video.videoWidth) return null
    const scale = Math.min(1, FRAME_WIDTH / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
  }

  const act = useCallback(
    async (staffId: string, name: string, proof: string, photo: string) => {
      setPhase({ kind: "working", name })
      try {
        const res = await fetch("/api/attendance/status", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-checkin-token": checkInToken },
          body: JSON.stringify({ staffId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Could not load attendance")
        const status = data.status

        cooldowns.current.set(staffId, Date.now() + COOLDOWN_MS)

        if (status.hasCheckedOut) {
          showResult({ tone: "info", title: `${name}, you're done for today`, detail: "Your check-in and check-out are already recorded." })
          return
        }

        if (status.hasCheckedIn) {
          setPhase({ kind: "confirm-checkout", staffId, name, proof, photo })
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(
            () => setPhase({ kind: "scanning", hint: "Look at the camera to check in" }),
            CHECKOUT_PROMPT_MS
          )
          return
        }

        const outcome = await onCheckIn({ staffId, type: "check-in", proof, photo })
        if (outcome === "pending") {
          showResult({ tone: "info", title: `Hi ${name}`, detail: "Complete the extra verification to finish checking in." }, 8000)
        } else if (outcome) {
          const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          showResult({ tone: "success", title: `Welcome, ${name}!`, detail: `Checked in at ${time}` })
        } else {
          cooldowns.current.delete(staffId)
          showResult({ tone: "error", title: "Check-in failed", detail: "Please try again or use manual entry." })
        }
      } catch (err) {
        cooldowns.current.delete(staffId)
        showResult({ tone: "error", title: "Something went wrong", detail: err instanceof Error ? err.message : undefined })
      }
    },
    [checkInToken, onCheckIn, showResult]
  )

  const confirmCheckout = async () => {
    const current = phaseRef.current
    if (current.kind !== "confirm-checkout") return
    if (timer.current) clearTimeout(timer.current)
    setPhase({ kind: "working", name: current.name })
    const outcome = await onCheckIn({ staffId: current.staffId, type: "check-out", proof: current.proof, photo: current.photo })
    if (outcome === "pending") {
      showResult({ tone: "info", title: `Bye ${current.name}`, detail: "Complete the extra verification to finish checking out." }, 8000)
    } else if (outcome) {
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      showResult({ tone: "success", title: `Goodbye, ${current.name}!`, detail: `Checked out at ${time}` })
    } else {
      showResult({ tone: "error", title: "Check-out failed", detail: "Please try again or use manual entry." })
    }
  }

  const cancelCheckout = () => {
    if (timer.current) clearTimeout(timer.current)
    setPhase({ kind: "scanning", hint: "Look at the camera to check in" })
  }

  // Scan loop
  useEffect(() => {
    if (!stream) return
    let stopped = false
    let delay = IDLE_SCAN_INTERVAL_MS

    const scan = async () => {
      if (stopped) return
      const current = phaseRef.current
      if (current.kind === "scanning" && !inFlight.current && document.visibilityState === "visible") {
        const frame = captureFrame()
        if (frame) {
          inFlight.current = true
          try {
            const res = await fetch("/api/biometric/face/authenticate", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-checkin-token": checkInToken },
              body: JSON.stringify({ faceImage: frame }),
            })
            const data = await res.json().catch(() => ({}))
            const closeEnough = (data.faceWidthRatio ?? 0) >= MIN_FACE_WIDTH_RATIO

            if (res.ok && data.staffId) {
              delay = SCAN_INTERVAL_MS
              if (!closeEnough) {
                streak.current = { staffId: "", count: 0 }
                setPhase({ kind: "scanning", hint: "Step a little closer to the camera" })
              } else if ((cooldowns.current.get(data.staffId) ?? 0) > Date.now()) {
                streak.current = { staffId: "", count: 0 }
                setPhase({ kind: "scanning", hint: `${data.staffName}, you were just recorded` })
              } else {
                streak.current =
                  streak.current.staffId === data.staffId
                    ? { staffId: data.staffId, count: streak.current.count + 1 }
                    : { staffId: data.staffId, count: 1 }
                if (streak.current.count >= REQUIRED_MATCHES) {
                  streak.current = { staffId: "", count: 0 }
                  await act(data.staffId, data.staffName, data.biometricProof, frame)
                } else {
                  setPhase({ kind: "scanning", hint: `Hi ${data.staffName}, hold still…` })
                }
              }
            } else {
              streak.current = { staffId: "", count: 0 }
              if (data.code === "NO_FACE") {
                delay = IDLE_SCAN_INTERVAL_MS
                setPhase({ kind: "scanning", hint: "Look at the camera to check in" })
              } else if (data.code === "NOT_RECOGNIZED") {
                delay = SCAN_INTERVAL_MS
                setPhase({
                  kind: "scanning",
                  hint: closeEnough
                    ? "Face not recognised. Ask your administrator to register you."
                    : "Step a little closer to the camera",
                })
              } else {
                delay = 5000
                setPhase({ kind: "scanning", hint: data.error || "Face recognition is unavailable right now" })
              }
            }
          } catch {
            delay = 5000
          } finally {
            inFlight.current = false
          }
        }
      }
      if (!stopped) setTimeout(scan, delay)
    }

    const first = setTimeout(scan, 800)
    return () => {
      stopped = true
      clearTimeout(first)
    }
  }, [stream, checkInToken, act])

  const toneStyles = {
    success: "bg-green-600",
    info: "bg-blue-600",
    error: "bg-red-600",
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3]">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-300 p-6 text-center">
            <Camera className="w-12 h-12" />
            {cameraError ? <p className="text-sm">{cameraError}</p> : <p className="text-sm">Starting camera…</p>}
            {cameraError && (
              <Button variant="secondary" onClick={startCamera}>
                Try again
              </Button>
            )}
          </div>
        )}

        {/* Face guide */}
        {stream && phase.kind === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2/5 aspect-[3/4] rounded-[50%] border-4 border-white/70" />
          </div>
        )}

        {(phase.kind === "working" || phase.kind === "result" || phase.kind === "confirm-checkout") && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white ${
              phase.kind === "result" ? toneStyles[phase.tone] : "bg-gray-900/80"
            }`}
          >
            {phase.kind === "working" && (
              <>
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="text-xl font-semibold">One moment, {phase.name}…</p>
              </>
            )}
            {phase.kind === "result" && (
              <>
                {phase.tone === "success" ? (
                  <CheckCircle2 className="w-16 h-16" />
                ) : phase.tone === "error" ? (
                  <UserX className="w-16 h-16" />
                ) : (
                  <ScanFace className="w-16 h-16" />
                )}
                <p className="text-2xl font-bold">{phase.title}</p>
                {phase.detail && <p className="text-lg opacity-90">{phase.detail}</p>}
              </>
            )}
            {phase.kind === "confirm-checkout" && (
              <>
                <p className="text-2xl font-bold">Hi {phase.name}</p>
                <p className="text-lg opacity-90">You&apos;re checked in. Leaving for the day?</p>
                <div className="flex gap-3 mt-2">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100" onClick={confirmCheckout}>
                    <LogOut className="w-5 h-5 mr-2" />
                    Check out
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={cancelCheckout}>
                    Not now
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {phase.kind === "scanning" && (
        <p className="text-center text-lg font-medium text-gray-700 flex items-center justify-center gap-2">
          <ScanFace className="w-5 h-5 text-blue-600" />
          {phase.hint}
        </p>
      )}
    </div>
  )
}
