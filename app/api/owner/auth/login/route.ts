/**
 * Super Admin Login API Route
 * POST /api/owner/auth/login
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { comparePassword } from "@/lib/auth/password"
import { generateSuperAdminToken } from "@/lib/auth/super-admin"
import {
  SuperAdminError,
  createInvalidCredentialsError,
  createDatabaseError,
  createValidationError,
} from "@/lib/errors/super-admin-errors"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      throw createValidationError("Email and password are required")
    }

    if (typeof email !== "string" || typeof password !== "string") {
      throw createValidationError("Invalid email or password format")
    }

    // Get database connection
    const db = await getDatabase()
    const superAdminsCollection = db.collection("super_admins")

    // Find super admin by email
    const superAdmin = await superAdminsCollection.findOne({ email: email.toLowerCase() })

    if (!superAdmin) {
      throw createInvalidCredentialsError()
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      throw new SuperAdminError(
        "Account is inactive. Please contact support.",
        "ACCOUNT_INACTIVE",
        403
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, superAdmin.password)

    if (!isPasswordValid) {
      throw createInvalidCredentialsError()
    }

    // Update last login timestamp
    await superAdminsCollection.updateOne(
      { _id: superAdmin._id },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    // Generate JWT token
    const token = generateSuperAdminToken({
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
    })

    // Log successful login to audit logs
    const auditLogsCollection = db.collection("system_audit_logs")
    await auditLogsCollection.insertOne({
      actorId: superAdmin._id.toString(),
      actorRole: "super_admin",
      actorEmail: superAdmin.email,
      action: "LOGIN",
      metadata: {
        timestamp: new Date(),
        success: true,
      },
      ipAddress: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
    })

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: superAdmin._id.toString(),
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: "super_admin",
      },
    })
  } catch (error) {
    console.error("Super admin login error:", error)

    // Handle SuperAdminError
    if (error instanceof SuperAdminError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      )
    }

    // Handle unexpected errors
    const dbError = createDatabaseError("Login failed. Please try again.")
    return NextResponse.json(
      {
        success: false,
        error: dbError.message,
        code: dbError.code,
      },
      { status: dbError.statusCode }
    )
  }
}
