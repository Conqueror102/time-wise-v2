/**
 * Get Current User API - Returns authenticated user info
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/auth"
import { User, Organization, TenantError } from "@/lib/types"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const context = await withAuth(request)

    const db = await getDatabase()

    // Get user
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(context.userId) })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get organization
    const organization = await db
      .collection<Organization>("organizations")
      .findOne({ _id: new ObjectId(context.tenantId) })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
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
    console.error("Get user error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to get user information" },
      { status: 500 }
    )
  }
}
