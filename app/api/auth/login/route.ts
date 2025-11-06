/**
 * Login API - Authenticates user and returns JWT token
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { comparePassword, generateAccessToken } from "@/lib/auth"
import { LoginRequest, User, Organization, TenantError, ErrorCodes } from "@/lib/types"
import { ObjectId } from "mongodb"
import { withErrorHandler } from "@/lib/middleware/error-handler"

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      throw new TenantError(
        "Email and password are required",
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    let db
    try {
      db = await getDatabase()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      throw new TenantError(
        "Unable to connect to the database. Please try again later.",
        ErrorCodes.DATABASE_ERROR,
        503
      )
    }

    // Find user by email
    const user = await db.collection<User>("users").findOne({ 
      email: email.toLowerCase().trim() 
    })

    if (!user) {
      throw new TenantError(
        "Invalid email or password",
        ErrorCodes.INVALID_CREDENTIALS,
        401
      );
    }

    // Verify password
    let isPasswordValid;
    try {
      isPasswordValid = await comparePassword(password, user.password);
    } catch (error) {
      console.error("Password comparison error:", error)
      throw new TenantError(
        "Authentication error. Please try again.",
        ErrorCodes.AUTH_ERROR,
        500
      )
    }

    if (!isPasswordValid) {
      throw new TenantError(
        "Invalid email or password",
        ErrorCodes.INVALID_CREDENTIALS,
        401
      )
    }

    // Check if user is active
    if (!user.isActive) {
      throw new TenantError(
        "Your account has been deactivated. Please contact support.",
        ErrorCodes.ACCOUNT_DEACTIVATED,
        403
      )
    }

    // Check if email is verified (some schemas may not include this field)
    if ((user as any).emailVerified === false) {
      throw new TenantError(
        "Please verify your email before logging in",
        ErrorCodes.EMAIL_NOT_VERIFIED,
        403,
        { email: user.email }
      )
    }

    // Get organization
    const organization = await db
      .collection<Organization>("organizations")
      .findOne({ _id: new ObjectId(user.tenantId) });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check organization status
    if (organization.status === "suspended") {
      return NextResponse.json({ error: "Your organization account has been suspended. Please contact support." }, { status: 403 });
    }

    // Generate JWT token
    const accessToken = generateAccessToken({
      userId: user._id!.toString(),
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    // Update last login
    await db.collection("users").updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Return success (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      accessToken,
      user: { ...userWithoutPassword, _id: user._id!.toString() },
      organization: { ...organization, _id: organization._id!.toString() },
    })

  } catch (error) {
    console.error('Login error:', error)
    // Let the error handler format the response
    throw error
  }
})
