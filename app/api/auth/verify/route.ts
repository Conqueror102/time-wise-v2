import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { User, Organization, TenantError, ErrorCodes } from "@/lib/types"
import { ObjectId } from "mongodb"
import { withErrorHandler } from "@/lib/middleware/error-handler"
import { verifyToken } from "@/lib/auth"

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      throw new TenantError(
        "No token provided",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      throw new TenantError(
        "Invalid token format",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }

    // Verify JWT token
    const decoded = verifyToken(token)
    if (!decoded) {
      throw new TenantError(
        "Invalid or expired token",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }

    // Get user from database to ensure they still exist and are active
    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(decoded.userId)
    })

    if (!user) {
      throw new TenantError(
        "User not found",
        ErrorCodes.TENANT_NOT_FOUND,
        404
      )
    }

    if (!user.isActive) {
      throw new TenantError(
        "User account is deactivated",
        ErrorCodes.ACCOUNT_DEACTIVATED,
        403
      )
    }

    // Get organization to check status
    const organization = await db.collection<Organization>("organizations").findOne({
      _id: new ObjectId(user.tenantId)
    })

    if (!organization) {
      throw new TenantError(
        "Organization not found",
        ErrorCodes.TENANT_NOT_FOUND,
        404
      )
    }

    if (organization.status === "suspended") {
      throw new TenantError(
        "Organization is suspended",
        ErrorCodes.TENANT_SUSPENDED,
        403
      )
    }

    // Return user data without sensitive fields
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        _id: user._id!.toString()
      },
      organization: {
        ...organization,
        _id: organization._id!.toString()
      }
    })

  } catch (error) {
    throw error
  }
})