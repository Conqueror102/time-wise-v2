/**
 * Forgot Password API - Send password reset email
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createResetTokenData, checkRateLimit } from "@/lib/services/otp"
import { sendPasswordResetEmail } from "@/lib/services/email"
import { validateEmail } from "@/lib/database/validation"

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

        // Don't reveal if user exists (security best practice)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, you will receive a password reset link.",
            })
        }

        // Check if user is active
        if (!user.isActive) {
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, you will receive a password reset link.",
            })
        }

        // Check rate limiting
        const resetRequests = user.resetRequests || []
        const rateLimit = checkRateLimit(resetRequests.map((r: any) => new Date(r)))

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: rateLimit.error },
                { status: 429 }
            )
        }

        // Generate reset token
        const resetData = createResetTokenData()

        // Update user with reset token
        await db.collection("users").updateOne(
            { email },
            {
                $set: {
                    resetToken: resetData,
                    updatedAt: new Date(),
                },
                $push: {
                    resetRequests: new Date() as any,
                },
            }
        )

        // Send password reset email
        const emailResult = await sendPasswordResetEmail({
            to: email,
            resetToken: resetData.token,
            firstName: user.firstName,
        })

        if (!emailResult.success) {
            console.error("Failed to send reset email:", emailResult.error)
            return NextResponse.json(
                { error: "Failed to send password reset email. Please try again." },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, you will receive a password reset link.",
        })
    } catch (error) {
        console.error("Forgot password error:", error)
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        )
    }
}
