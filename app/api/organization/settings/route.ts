/**
 * Organization Settings API
 */

import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/auth"
import { TenantError } from "@/lib/types"
import { isValidTimeZone } from "@/lib/utils/date"

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin"],
    })

    const body = await request.json()
    const {
      latenessTime,
      earlyDepartureTime,
      workStartTime,
      workEndTime,
      timezone,
      checkInPasscode,
      capturePhotos,
      verifyFaceOnIdCheckIn,
      // photoRetentionDays removed - retention is fixed to 7 days by default
      enabledCheckInMethods,
    } = body

    const db = await getDatabase()


    if (timezone !== undefined && !isValidTimeZone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone. Use an IANA name such as Africa/Lagos or Europe/London." },
        { status: 400 }
      )
    }

    if (checkInPasscode !== undefined && checkInPasscode !== "" && !/^[A-Za-z0-9]{4,32}$/.test(String(checkInPasscode))) {
      return NextResponse.json(
        { error: "Check-in passcode must be 4-32 letters or digits" },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (latenessTime !== undefined) updateData["settings.latenessTime"] = latenessTime
    if (earlyDepartureTime !== undefined) updateData["settings.earlyDepartureTime"] = earlyDepartureTime
    if (workStartTime !== undefined) updateData["settings.workStartTime"] = workStartTime
    if (workEndTime !== undefined) updateData["settings.workEndTime"] = workEndTime
    if (timezone !== undefined) updateData["settings.timezone"] = timezone
    if (checkInPasscode !== undefined) updateData["settings.checkInPasscode"] = checkInPasscode
    if (capturePhotos !== undefined) updateData["settings.capturePhotos"] = capturePhotos
    if (verifyFaceOnIdCheckIn !== undefined) updateData["settings.verifyFaceOnIdCheckIn"] = verifyFaceOnIdCheckIn === true
    // Intentionally ignore photoRetentionDays updates; retention is fixed at 7 days
    if (enabledCheckInMethods !== undefined) updateData["settings.enabledCheckInMethods"] = enabledCheckInMethods


    // Update organization settings
    await db.collection("organizations").updateOne(
      { _id: new ObjectId(context.tenantId) },
      { $set: updateData }
    )

    // Fetch updated organization
    const organization = await db
      .collection("organizations")
      .findOne({ _id: new ObjectId(context.tenantId) })


    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      organization,
    })
  } catch (error) {
    console.error("Update settings error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
