"use client"

/**
 * Kiosk side of the head-turn liveness check (see lib/checkin/liveness.ts).
 * Sends camera frames until the server says every step is done, then returns the proof.
 */

export type LivenessStep = "left" | "right"

export interface LivenessChallenge {
  token: string
  steps: LivenessStep[]
}

export type LivenessProgress = { step: number; steps: LivenessStep[]; hint: string }

export type LivenessOutcome =
  | { ok: true; proof: string; photo: string }
  | { ok: false; error: string }

const FRAME_INTERVAL_MS = 450
// A little longer than the server's deadline, so the server always decides
const GIVE_UP_MS = 22_000

export const stepHint = (step: LivenessStep) =>
  step === "left" ? "Turn your head to your left" : "Turn your head to your right"

export async function runLiveness(options: {
  checkInToken: string
  challenge: LivenessChallenge
  captureFrame: () => string | null
  onProgress: (progress: LivenessProgress) => void
  isCancelled?: () => boolean
}): Promise<LivenessOutcome> {
  const { checkInToken, captureFrame, onProgress, isCancelled } = options
  const steps = options.challenge.steps
  let token = options.challenge.token
  let step = 0
  const startedAt = Date.now()
  onProgress({ step, steps, hint: stepHint(steps[0]) })

  while (Date.now() - startedAt < GIVE_UP_MS) {
    if (isCancelled?.()) return { ok: false, error: "Cancelled" }
    await new Promise((resolve) => setTimeout(resolve, FRAME_INTERVAL_MS))
    const frame = captureFrame()
    if (!frame) continue

    let data: any = {}
    let status = 0
    try {
      const res = await fetch("/api/biometric/face/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-checkin-token": checkInToken },
        body: JSON.stringify({ challenge: token, faceImage: frame }),
      })
      status = res.status
      data = await res.json().catch(() => ({}))
    } catch {
      continue
    }

    if (data.status === "passed" && data.biometricProof) return { ok: true, proof: data.biometricProof, photo: frame }
    if (data.status === "next") {
      token = data.challenge
      step += 1
      onProgress({ step, steps, hint: stepHint(steps[step]) })
    } else if (data.status === "continue") {
      onProgress({ step, steps, hint: data.hint || stepHint(steps[step]) })
    } else if (data.status === "failed" || data.status === "expired" || status === 401) {
      return { ok: false, error: data.error || "The face check didn't pass. Please try again." }
    } else if (status >= 500) {
      return { ok: false, error: data.error || "Face recognition is unavailable right now" }
    }
  }
  return { ok: false, error: "Time ran out. Please look at the camera and try again." }
}
