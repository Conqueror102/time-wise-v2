/**
 * Organization Settings API
 */

import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/auth"
import { TenantError } from "@/lib/types"

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
      // photoRetentionDays removed - retention is fixed to 7 days by default
      fingerprintEnabled,
      enabledCheckInMethods,
    } = body

    const db = await getDatabase()

    console.log("=== SETTINGS UPDATE DEBUG ===")
    console.log("Request body:", body)
    console.log("capturePhotos from body:", {
      value: capturePhotos,
      type: typeof capturePhotos
    })

    // Build update object
    const updateData: any = {}
    if (latenessTime !== undefined) updateData["settings.latenessTime"] = latenessTime
    if (earlyDepartureTime !== undefined) updateData["settings.earlyDepartureTime"] = earlyDepartureTime
    if (workStartTime !== undefined) updateData["settings.workStartTime"] = workStartTime
    if (workEndTime !== undefined) updateData["settings.workEndTime"] = workEndTime
    if (timezone !== undefined) updateData["settings.timezone"] = timezone
    if (checkInPasscode !== undefined) updateData["settings.checkInPasscode"] = checkInPasscode
    if (capturePhotos !== undefined) updateData["settings.capturePhotos"] = capturePhotos
    // Intentionally ignore photoRetentionDays updates; retention is fixed at 7 days
    if (fingerprintEnabled !== undefined) updateData["settings.fingerprintEnabled"] = fingerprintEnabled
    if (enabledCheckInMethods !== undefined) updateData["settings.enabledCheckInMethods"] = enabledCheckInMethods

    console.log("Update data being saved:", updateData)
    console.log("=== END SETTINGS DEBUG ===")

    // Update organization settings
    await db.collection("organizations").updateOne(
      { _id: new ObjectId(context.tenantId) },
      { $set: updateData }
    )

    // Fetch updated organization
    const organization = await db
      .collection("organizations")
      .findOne({ _id: new ObjectId(context.tenantId) })

    console.log("=== AFTER UPDATE ===")
    console.log("Updated organization settings:", organization?.settings)
    console.log("capturePhotos after save:", {
      value: organization?.settings?.capturePhotos,
      type: typeof organization?.settings?.capturePhotos
    })
    console.log("=== END AFTER UPDATE ===")

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
