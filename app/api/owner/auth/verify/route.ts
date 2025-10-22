import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
      role: string
    }

    // Check if role is super_admin
    if (decoded.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized: Not a super admin" },
        { status: 403 }
      )
    }

    // Fetch super admin from database
    const db = await getDatabase()
    const superAdmin = await db.collection("super_admins").findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json(
        { error: "Account not found or inactive" },
        { status: 401 }
      )
    }

    // Return user info
    return NextResponse.json({
      success: true,
      user: {
        userId: superAdmin._id.toString(),
        email: superAdmin.email,
        firstName: superAdmin.firstName || "Super",
        lastName: superAdmin.lastName || "Admin",
      },
    })
  } catch (error: any) {
    console.error("Token verification error:", error)
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
    
    if (error.name === "TokenExpiredError") {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Token verification failed" },
      { status: 401 }
    )
  }
}
