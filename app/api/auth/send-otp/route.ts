/**
 * Send OTP API - Send verification code to email
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createOTPData, checkRateLimit } from "@/lib/services/otp"
import { sendOTPEmail } from "@/lib/services/email"
import { validateEmail } from "@/lib/database/validation"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    try {
      validateEmail(email)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const db = await getDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
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

    // Check rate limiting
    const otpRequests = user.otpRequests || []
    const rateLimit = checkRateLimit(otpRequests.map((r: any) => new Date(r)))

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error },
        { status: 429 }
      )
    }

    // Generate OTP
    const otpData = createOTPData()

    // Update user with OTP data
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          otp: otpData,
          updatedAt: new Date(),
        },
        $push: {
          otpRequests: new Date(),
        },
      }
    )

    // Send OTP email
    const emailResult = await sendOTPEmail({
      to: email,
      otp: otpData.code,
      firstName: user.firstName,
    })

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error)
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresIn: 10, // minutes
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    )
  }
}
