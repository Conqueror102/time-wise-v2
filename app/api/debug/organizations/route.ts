/**
 * Debug Endpoint - List Organizations
 * ONLY WORKS IN DEVELOPMENT MODE
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    const db = await getDatabase()

    // Get all organizations
    const organizations = await db.collection("organizations").find({}).toArray()

    // Get all users
    const users = await db.collection("users").find({}).toArray()

    return NextResponse.json({
      success: true,
      count: organizations.length,
      organizations: organizations.map(org => ({
        id: org._id.toString(),
        name: org.name,
        subdomain: org.subdomain,
        adminEmail: org.adminEmail,
        status: org.status,
        subscriptionTier: org.subscriptionTier,
        checkInPasscode: org.settings?.checkInPasscode || "Not set",
        createdAt: org.createdAt,
      })),
      users: users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
      })),
    })
  } catch (error) {
    console.error("Debug organizations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}
