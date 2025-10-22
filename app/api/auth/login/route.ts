/**
 * Login API - Authenticates user and returns JWT token
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { comparePassword, generateAccessToken } from "@/lib/auth"
import { LoginRequest, User, Organization, TenantError, ErrorCodes } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find user by email
    const user = await db.collection<User>("users").findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated" },
        { status: 403 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: "Please verify your email before logging in",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email
        },
        { status: 403 }
      )
    }

    // Get organization
    const organization = await db
      .collection<Organization>("organizations")
      .findOne({ _id: new ObjectId(user.tenantId) })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check organization status
    if (organization.status === "suspended") {
      return NextResponse.json(
        { error: "Your organization account has been suspended. Please contact support." },
        { status: 403 }
      )
    }

    // Generate JWT token
    const accessToken = generateAccessToken({
      userId: user._id!.toString(),
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    })

    // Update last login
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    )

    // Return success (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      accessToken,
      user: {
        ...userWithoutPassword,
        _id: user._id!.toString(),
      },
      organization: {
        ...organization,
        _id: organization._id!.toString(),
      },
    })
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )
  }
}
