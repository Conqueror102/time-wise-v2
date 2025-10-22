/**
 * Get Current Super Admin Info API Route
 * GET /api/owner/auth/me
 */

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import {
  SuperAdminError,
  createDatabaseError,
  createNotFoundError,
} from "@/lib/errors/super-admin-errors"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Get database connection
    const db = await getDatabase()
    const superAdminsCollection = db.collection("super_admins")

    // Find super admin by ID
    const superAdmin = await superAdminsCollection.findOne({
      _id: new ObjectId(context.userId),
    })

    if (!superAdmin) {
      throw createNotFoundError("Super admin")
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      throw new SuperAdminError(
        "Account is inactive. Please contact support.",
        "ACCOUNT_INACTIVE",
        403
      )
    }

    // Return user info (without password)
    return NextResponse.json({
      success: true,
      user: {
        id: superAdmin._id.toString(),
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: "super_admin",
        isActive: superAdmin.isActive,
        createdAt: superAdmin.createdAt,
        lastLogin: superAdmin.lastLogin,
      },
    })
  } catch (error) {
    console.error("Get super admin info error:", error)

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
    const dbError = createDatabaseError("Failed to get user info. Please try again.")
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
