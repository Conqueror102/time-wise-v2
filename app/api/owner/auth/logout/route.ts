/**
 * Super Admin Logout API Route
 * POST /api/owner/auth/logout
 */

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"
import { SuperAdminError, createDatabaseError } from "@/lib/errors/super-admin-errors"

export async function POST(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Log logout to audit logs
    const db = await getDatabase()
    const auditLogsCollection = db.collection("system_audit_logs")

    await auditLogsCollection.insertOne({
      actorId: context.userId,
      actorRole: "super_admin",
      actorEmail: context.email,
      action: "LOGOUT",
      metadata: {
        timestamp: new Date(),
      },
      ipAddress: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
    })

    // Return success response
    // Note: Token invalidation happens client-side by removing the token
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Super admin logout error:", error)

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
    const dbError = createDatabaseError("Logout failed. Please try again.")
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
