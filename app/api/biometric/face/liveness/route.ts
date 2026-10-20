/**
 * One frame of the head-turn liveness check (kiosk).
 * Body: { challenge, faceImage }. Returns the next step, a hint, or, once every
 * step is done, the biometric proof the check-in endpoint requires.
 */

import { NextRequest, NextResponse } from "next/server"
import { TenantError } from "@/lib/types"
import { signBiometricProof, verifyKioskRequest } from "@/lib/auth/checkin-tokens"
import { searchFace } from "@/lib/services/face-recognition"
import { checkFrame, verifyChallenge } from "@/lib/checkin/liveness"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = verifyKioskRequest(request)
    const { challenge, faceImage } = await request.json()

    if (!faceImage || typeof faceImage !== "string") {
      return NextResponse.json({ error: "Face image is required" }, { status: 400 })
    }

    const claims = verifyChallenge(challenge, tenantId)
    const match = await searchFace(faceImage, tenantId, { landmarks: true })
    if (!match.success && !match.noFace && match.faceWidthRatio === undefined) {
      return NextResponse.json({ error: match.error || "Face recognition is unavailable", code: "SERVICE_ERROR" }, { status: 503 })
    }

    const result = checkFrame(claims, match)
    switch (result.status) {
      case "passed":
        return NextResponse.json({
          status: "passed",
          staffId: claims.staffId,
          biometricProof: signBiometricProof(tenantId, claims.staffId, "face", { live: true }),
        })
      case "next":
        return NextResponse.json({ status: "next", challenge: result.token, step: result.step })
      case "failed":
        return NextResponse.json({ status: "failed", error: result.reason }, { status: 409 })
      default:
        return NextResponse.json({ status: "continue", hint: result.hint })
    }
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ status: "expired", error: error.message }, { status: error.statusCode })
    }
    console.error("Face liveness error:", error)
    return NextResponse.json({ error: "Failed to check the face" }, { status: 500 })
  }
}
