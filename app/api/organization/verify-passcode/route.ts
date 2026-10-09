/**
 * Verify Organization Check-In Passcode
 * On success returns a kiosk token that the check-in endpoints require,
 * plus the organization's check-in policy.
 */

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { signKioskToken } from "@/lib/auth/checkin-tokens"
import { getCheckInPolicy } from "@/lib/checkin/policy"
import { applyRateLimit, RateLimitPresets } from "@/lib/middleware/rate-limit"

export const dynamic = 'force-dynamic'

function passcodesMatch(stored: string, provided: string): boolean {
  const a = crypto.createHash("sha256").update(stored).digest()
  const b = crypto.createHash("sha256").update(provided).digest()
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const { passcode, email } = await request.json()

    if (!passcode || !email || typeof passcode !== "string" || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email and passcode are required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const rateLimitResponse = await applyRateLimit(request, RateLimitPresets.CHECKIN_PASSCODE, normalizedEmail)
    if (rateLimitResponse) return rateLimitResponse

    const db = await getDatabase()
    const organization = await db.collection("organizations").findOne({ adminEmail: normalizedEmail })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found with this email. Please check your email address." },
        { status: 404 }
      )
    }

    if (organization.status === "suspended" || organization.status === "cancelled") {
      return NextResponse.json(
        { error: "This organization's account is not active. Please contact your administrator." },
        { status: 403 }
      )
    }

    const storedPasscode = organization.settings?.checkInPasscode
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!storedPasscode) {
      // Allow a default passcode in development only
      if (!(isDevelopment && passcode === "1234")) {
        return NextResponse.json(
          { error: "No passcode set. Admin must set a passcode in Settings first." },
          { status: 400 }
        )
      }
    } else if (!passcodesMatch(String(storedPasscode), passcode)) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 })
    }

    const tenantId = organization._id.toString()
    const policy = getCheckInPolicy(organization)

    return NextResponse.json({
      success: true,
      checkInToken: signKioskToken(tenantId),
      tenantId,
      organizationName: organization.name,
      // The kiosk takes a photo whenever the server needs one
      capturePhotos: policy.requirePhoto,
      enabledCheckInMethods: policy.enabledCheckInMethods,
      ...(!storedPasscode && { message: "Using default passcode (1234). Please set a passcode in Settings." }),
    })
  } catch (error) {
    console.error("Verify passcode error:", error)
    return NextResponse.json(
      { error: "Failed to verify credentials" },
      { status: 500 }
    )
  }
}
