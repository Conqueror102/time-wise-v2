/**
 * Verify OTP API - Verify email with OTP code
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { validateOTP } from "@/lib/services/otp"
import { sendWelcomeEmail } from "@/lib/services/email"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find user
    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Check if OTP exists
    if (!user.otp) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      )
    }

    // Increment attempt count
    await db.collection("users").updateOne(
      { email },
      {
        $inc: { "otp.attempts": 1 },
      }
    )

    // Validate OTP
    const validation = validateOTP(otp, user.otp)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get organization for welcome email
    const organization = await db.collection("organizations").findOne({
      _id: user.tenantId,
    })

    // Mark email as verified and clear OTP
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
        $unset: {
          otp: "",
          otpRequests: "",
        },
      }
    )

    // Send welcome email (don't wait for it)
    if (organization) {
      sendWelcomeEmail(email, user.firstName, organization.name).catch((error) => {
        console.error("Failed to send welcome email:", error)
      })
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}
