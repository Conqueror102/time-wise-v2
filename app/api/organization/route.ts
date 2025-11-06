import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUTCDate, addDaysUTC } from "@/lib/utils/date"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("id")

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    const organization = await db.collection("organizations").findOne({
      _id: new ObjectId(organizationId),
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, adminEmail } = await request.json()

    if (!name || !adminEmail) {
      return NextResponse.json({ error: "Name and admin email are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if organization already exists
    const existingOrg = await db.collection("organizations").findOne({ adminEmail })
    if (existingOrg) {
      return NextResponse.json({ error: "Organization with this email already exists" }, { status: 400 })
    }

    const newOrganization = {
      name,
      adminEmail,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      allowedMethods: ["manual"],
      settings: {
        latenessTime: "09:00",
        workEndTime: "17:00",
        maxStaff: 10,
      },
      createdAt: new Date(),
      trialEndsAt: addDaysUTC(getUTCDate(), 14), // 14 days trial
    }

    const result = await db.collection("organizations").insertOne(newOrganization)

    return NextResponse.json({
      success: true,
      organization: { ...newOrganization, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
