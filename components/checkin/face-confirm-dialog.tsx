"use client"

/**
 * Confirms the person at the kiosk is the staff member whose QR code or Staff ID was
 * used: recognise their face, then run the head-turn liveness check.
 * Shown when the check-in API answers LIVENESS_REQUIRED.
 */

import { useEffect, useRef, useState } from "react"
import { Camera, Loader2, ScanFace, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LivenessPrompt } from "@/components/checkin/liveness-prompt"
import { runLiveness, type LivenessProgress } from "@/lib/checkin/liveness-client"

const FRAME_WIDTH = 640
const SCAN_INTERVAL_MS = 900
const GIVE_UP_MS = 30_000

export interface FaceConfirmResult {
  proof: string
  photo: string
}

export function FaceConfirmDialog({
  checkInToken,
  staffId,
  onDone,
}: {
  checkInToken: string
  staffId: string
  /** Called once with the proof, or null when cancelled or failed */
  onDone: (result: FaceConfirmResult | null, error?: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hint, setHint] = useState("Starting camera…")
  const [progress, setProgress] = useState<LivenessProgress | null>(null)
  const [error, setError] = useState("")
  const finished = useRef(false)

  const finish = (result: FaceConfirmResult | null, message?: string) => {
    if (finished.current) return
    finished.current = true
    onDone(result, message)
  }

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

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } })
      } catch {
        setError("The camera is needed to confirm it's you.")
        return
      }
      if (cancelled) return
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => {})
      }
      setHint("Look straight at the camera")

      const startedAt = Date.now()
      while (!cancelled && Date.now() - startedAt < GIVE_UP_MS) {
        await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS))
        const frame = captureFrame()
        if (!frame) continue
        const res = await fetch("/api/biometric/face/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-checkin-token": checkInToken },
          body: JSON.stringify({ faceImage: frame, expectedStaffId: staffId }),
        }).catch(() => null)
        const data = res ? await res.json().catch(() => ({})) : {}

        if (data.code === "WRONG_PERSON") {
          setError(`This face doesn't match Staff ID ${staffId}.`)
          return
        }
        if (data.biometricProof) {
          // Liveness was turned off meanwhile: the plain proof is enough
          finish({ proof: data.biometricProof, photo: frame })
          return
        }
        if (data.liveness?.status === "challenge") {
          const outcome = await runLiveness({ checkInToken, challenge: data.liveness, captureFrame, onProgress: setProgress, isCancelled: () => cancelled })
          if (cancelled) return
          if (outcome.ok) finish({ proof: outcome.proof, photo: outcome.photo })
          else { setProgress(null); setError(outcome.error) }
          return
        }
        setHint(data.liveness?.hint || (data.code === "NO_FACE" ? "Look straight at the camera" : data.error || "Hold still…"))
      }
      if (!cancelled) setError("We couldn't see your face clearly. Please try again.")
    }

    run()
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per dialog
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Confirm it's you">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold text-gray-900"><ScanFace className="w-5 h-5 text-blue-600" />Confirm it&apos;s you</p>
          <button type="button" onClick={() => finish(null)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100" aria-label="Cancel"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          {progress && !error && <LivenessPrompt progress={progress} />}
          {!progress && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/5 aspect-[3/4] rounded-[50%] border-4 border-white/70" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/85 p-6 text-center text-white">
              <Camera className="w-10 h-10" />
              <p>{error}</p>
              <Button variant="secondary" onClick={() => finish(null, error)}>Close</Button>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {!progress && !error && <p className="flex items-center justify-center gap-2 text-center text-gray-700"><Loader2 className="w-4 h-4 animate-spin" />{hint}</p>}
      </div>
    </div>
  )
}
