/**
 * Organization Registration API
 * Creates a new organization with admin user
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, validatePasswordStrength } from "@/lib/auth"
import { validateSubdomain, validateEmail, sanitizeOrganizationName } from "@/lib/database/validation"
import { RegisterOrganizationRequest, Organization, User, TenantError, ErrorCodes } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body: RegisterOrganizationRequest = await request.json()
    const { name, subdomain, adminEmail, adminPassword, firstName, lastName } = body

    // Validate required fields
    if (!name || !subdomain || !adminEmail || !adminPassword || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate subdomain format
    try {
      validateSubdomain(subdomain)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      throw error
    }

    // Validate email format
    try {
      validateEmail(adminEmail)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      throw error
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(adminPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password requirements not met", details: passwordValidation.errors },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if subdomain already exists
    const existingSubdomain = await db.collection("organizations").findOne({ subdomain })
    if (existingSubdomain) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 400 }
      )
    }

    // Check if admin email already exists
    const existingEmail = await db.collection("users").findOne({ email: adminEmail })
    if (existingEmail) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword)

    // Create organization
    const organization: Omit<Organization, "_id"> = {
      name: sanitizeOrganizationName(name),
      subdomain: subdomain.toLowerCase(),
      adminEmail,
      status: "trial",
      subscriptionTier: "free",
      subscriptionStatus: "trial",
      createdAt: new Date(),
      updatedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      settings: {
        latenessTime: "09:00",
        workStartTime: "09:00",
        workEndTime: "17:00",
        maxStaff: 10,
        allowedMethods: ["qr", "manual"],
        timezone: "UTC",
      },
    }

    const orgResult = await db.collection("organizations").insertOne(organization)
    const organizationId = orgResult.insertedId.toString()

    // Create admin user
    const adminUser: Omit<User, "_id"> = {
      tenantId: organizationId,
      email: adminEmail,
      password: hashedPassword,
      role: "org_admin",
      firstName,
      lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const userResult = await db.collection("users").insertOne(adminUser)

    // Generate and send OTP for email verification
    const { createOTPData } = await import("@/lib/services/otp")
    const { sendOTPEmail } = await import("@/lib/services/email")
    
    const otpData = createOTPData()

    // Update user with OTP
    await db.collection("users").updateOne(
      { _id: userResult.insertedId },
      {
        $set: {
          otp: otpData,
          emailVerified: false,
          otpRequests: [new Date()],
        },
      }
    )

    // Send OTP email (don't block registration if email fails)
    sendOTPEmail({
      to: adminEmail,
      otp: otpData.code,
      firstName,
    }).catch((error) => {
      console.error("Failed to send OTP email:", error)
    })

    // Return success (without sensitive data)
    const { password: _, ...userWithoutPassword } = { ...adminUser, _id: userResult.insertedId }

    return NextResponse.json({
      success: true,
      message: "Organization registered successfully. Please check your email for verification code.",
      requiresVerification: true,
      organization: {
        ...organization,
        _id: orgResult.insertedId,
      },
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to register organization" },
      { status: 500 }
    )
  }
}
