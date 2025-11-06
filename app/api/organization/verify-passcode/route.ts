/**
 * Verify Organization Check-In Passcode
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { passcode, email } = await request.json()

    if (!passcode || !email) {
      return NextResponse.json(
        { error: "Email and passcode are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const normalizedEmail = email.toLowerCase().trim()

    // Find organization by email - try multiple status values
    let organization = await db.collection("organizations").findOne({
      adminEmail: normalizedEmail,
      status: "active",
    })

    // If not found with active status, try trial status
    if (!organization) {
      organization = await db.collection("organizations").findOne({
        adminEmail: normalizedEmail,
        status: "trial",
      })
    }

    // If still not found, try without status filter
    if (!organization) {
      organization = await db.collection("organizations").findOne({
        adminEmail: normalizedEmail,
      })
    }

    if (!organization) {
      // Debug: Check if any organizations exist
      const allOrgs = await db.collection("organizations").find({}).limit(5).toArray()
      console.log("Available organizations:", allOrgs.map(o => ({
        email: o.adminEmail,
        status: o.status,
        name: o.name
      })))

      return NextResponse.json(
        {
          error: "Organization not found with this email. Please check your email address.",
          debug: process.env.NODE_ENV === "development" ? {
            searchedEmail: normalizedEmail,
            availableEmails: allOrgs.map(o => o.adminEmail)
          } : undefined
        },
        { status: 404 }
      )
    }

    // Check if passcode is set
    const storedPasscode = organization.settings?.checkInPasscode

    // In development, allow empty passcode or match "1234" as default
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!storedPasscode) {
      // No passcode set yet
      if (isDevelopment && passcode === "1234") {
        // Allow default passcode in development
        return NextResponse.json({
          success: true,
          tenantId: organization._id.toString(),
          organizationName: organization.name,
          message: "Using default passcode (1234). Please set a passcode in Settings.",
        })
      }

      return NextResponse.json(
        { error: "No passcode set. Admin must set a passcode in Settings first." },
        { status: 400 }
      )
    }

    // Verify passcode matches
    if (storedPasscode !== passcode) {
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 401 }
      )
    }

    const capturePhotos = organization.settings?.capturePhotos || false
    console.log("=== VERIFY PASSCODE DEBUG ===")
    console.log("Organization found:", {
      id: organization._id,
      name: organization.name,
      email: organization.adminEmail,
    })
    console.log("Full settings object:", organization.settings)
    console.log("capturePhotos value:", {
      raw: organization.settings?.capturePhotos,
      type: typeof organization.settings?.capturePhotos,
      final: capturePhotos
    })
    console.log("=== END DEBUG ===")

    return NextResponse.json({
      success: true,
      tenantId: organization._id.toString(),
      organizationName: organization.name,
      capturePhotos: capturePhotos,
    })
  } catch (error) {
    console.error("Verify passcode error:", error)
    return NextResponse.json(
      { error: "Failed to verify credentials" },
      { status: 500 }
    )
  }
}
