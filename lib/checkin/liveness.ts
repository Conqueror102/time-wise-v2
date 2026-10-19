/**
 * Active liveness check for face check-ins.
 *
 * A single recognised photo only proves that the camera saw someone's face, and a
 * printed photo or a phone screen held up to the kiosk passes that. After a face is
 * recognised, the kiosk is given two head turns in a random order ("turn left, then
 * right" or the reverse). Each frame sent back must show the same staff member, close
 * to the camera, with the head actually turned the requested way compared with the
 * straight-on frame that started the challenge. A flat picture can't turn its head,
 * and the random order defeats a recording of someone turning one fixed way.
 *
 * The challenge is a short-lived signed token, so the server keeps no state: each
 * frame that completes a step returns a new token for the next step, and the final
 * step returns the biometric proof the check-in endpoint requires.
 *
 * Limits: this stops photos, screens and simple recordings. It is not a defence
 * against a realistic 3D mask or a deepfake played back in the right order.
 */

import crypto from "crypto"
import jwt from "jsonwebtoken"
import type { FaceMatch, HeadPose } from "@/lib/services/compreface"
import type { FaceProvider } from "@/lib/services/face-recognition"
import { TenantError, ErrorCodes } from "@/lib/types"

export type LivenessStep = "left" | "right"

/** How far the head must turn, in degrees of yaw, to count */
export const TURN_DEGREES = 15
/** The starting frame must be roughly straight on */
export const MAX_START_YAW = 12
/** Faces get a little narrower when turned, so allow slightly smaller faces mid-challenge */
export const MIN_FACE_WIDTH_RATIO = 0.12
/** Time to finish every step once the challenge starts */
export const CHALLENGE_SECONDS = 20

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const ISSUER = "timewise-checkin"
const AUDIENCE = "liveness"

export interface LivenessClaims {
  kind: "liveness"
  tenantId: string
  staffId: string
  steps: LivenessStep[]
  /** Index of the step the next frame must complete */
  step: number
  /** Yaw of the straight-on frame that started the challenge */
  baseYaw: number
  /** Random id, so two challenges are never identical */
  nonce: string
  /** Unix seconds when the challenge must be finished; carried through every step */
  deadline: number
}

/**
 * Which sign of yaw means the person turned to their own left. Providers differ, so it
 * can be overridden with FACE_YAW_LEFT_SIGN=1 or -1 if a check always fails one way.
 */
export function leftYawSign(provider: FaceProvider | null): 1 | -1 {
  const override = Number(process.env.FACE_YAW_LEFT_SIGN)
  if (override === 1 || override === -1) return override
  return provider === "rekognition" ? -1 : 1
}

/** Two turns, left and right, in a random order */
export function randomSteps(): LivenessStep[] {
  return crypto.randomInt(2) === 0 ? ["left", "right"] : ["right", "left"]
}

export function startChallenge(tenantId: string, staffId: string, pose: HeadPose): { token: string; steps: LivenessStep[] } {
  const steps = randomSteps()
  const deadline = Math.floor(Date.now() / 1000) + CHALLENGE_SECONDS
  const claims: LivenessClaims = { kind: "liveness", tenantId, staffId, steps, step: 0, baseYaw: pose.yaw, nonce: crypto.randomUUID(), deadline }
  return { token: signClaims(claims), steps }
}

function signClaims(claims: LivenessClaims): string {
  const { kind, tenantId, staffId, steps, step, baseYaw, nonce, deadline } = claims
  // exp is the deadline, so moving to the next step never extends the time allowed
  return jwt.sign({ kind, tenantId, staffId, steps, step, baseYaw, nonce, deadline, exp: deadline }, JWT_SECRET, { issuer: ISSUER, audience: AUDIENCE })
}

export function verifyChallenge(token: string | null | undefined, tenantId: string): LivenessClaims {
  try {
    if (!token) throw new Error("missing")
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: ISSUER, audience: AUDIENCE }) as LivenessClaims
    if (decoded.kind !== "liveness" || decoded.tenantId !== tenantId) throw new Error("wrong token")
    return decoded
  } catch {
    throw new TenantError("The face check timed out. Please look at the camera to start again.", ErrorCodes.UNAUTHORIZED, 401)
  }
}

/** Is this pose straight enough on to start a challenge from? */
export function isFacingCamera(pose: HeadPose | undefined): pose is HeadPose {
  return !!pose && Math.abs(pose.yaw) <= MAX_START_YAW
}

export type FrameResult =
  /** Not there yet: keep sending frames */
  | { status: "continue"; hint: string }
  /** This step is done; send the next frames with the new token */
  | { status: "next"; token: string; step: LivenessStep }
  /** Every step is done */
  | { status: "passed" }
  /** Someone else, or something that can't be a live person: start over */
  | { status: "failed"; reason: string }

/** Check one frame against the current step of a challenge */
export function checkFrame(claims: LivenessClaims, match: FaceMatch, provider: FaceProvider | null): FrameResult {
  if (!match.success || !match.staffId) {
    return match.noFace
      ? { status: "continue", hint: "Keep your face in view" }
      : match.faceWidthRatio !== undefined
        ? { status: "failed", reason: "A different face appeared. Please start again." }
        : { status: "continue", hint: "Hold on…" }
  }
  if (match.staffId !== claims.staffId) {
    return { status: "failed", reason: "A different face appeared. Please start again." }
  }
  if ((match.faceWidthRatio ?? 0) < MIN_FACE_WIDTH_RATIO) {
    return { status: "continue", hint: "Stay close to the camera" }
  }
  if (!match.pose) {
    return { status: "continue", hint: "Hold on…" }
  }

  const step = claims.steps[claims.step]
  const wanted = (step === "left" ? 1 : -1) * leftYawSign(provider)
  const turned = (match.pose.yaw - claims.baseYaw) * wanted

  if (turned >= TURN_DEGREES) {
    const next = claims.step + 1
    if (next >= claims.steps.length) return { status: "passed" }
    return { status: "next", token: signClaims({ ...claims, step: next }), step: claims.steps[next] }
  }
  return { status: "continue", hint: step === "left" ? "Turn your head to your left" : "Turn your head to your right" }
}
