/**
 * Public Check-In/Out API - Multi-tenant aware, no authentication required
 * Staff members can check in/out using their staffId without logging in
 */

import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, AttendanceLog } from "@/lib/types"
import {
  uploadCheckInPhoto,
  uploadCheckOutPhoto,
  isCloudinaryConfigured,
} from "@/lib/services/cloudinary"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, type, tenantId, photo, method } = await request.json()

    if (!staffId || !type) {
      return NextResponse.json({ error: "Staff ID and type are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // If tenantId is not provided, try to find the staff across all organizations
    let finalTenantId = tenantId
    let staff: any = null

    if (!finalTenantId) {
      // Search for staff member across organizations
      const staffDoc = await db.collection("staff").findOne({ staffId })

      if (!staffDoc) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 })
      }

      finalTenantId = staffDoc.tenantId
      staff = staffDoc
    } else {
      // Use provided tenantId
      const tenantDb = createTenantDatabase(db, finalTenantId)
      staff = await tenantDb.findOne<Staff>("staff", { staffId })
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    if (!staff.isActive) {
      return NextResponse.json({ error: "Staff member is inactive" }, { status: 403 })
    }

    // Get organization settings for lateness and early departure check
    const organization = await db
      .collection("organizations")
      .findOne({ _id: new ObjectId(finalTenantId) })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const latenessTime = organization?.settings?.latenessTime || "09:00"
    const earlyDepartureTime = organization?.settings?.earlyDepartureTime || "17:00"
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]

    // Check if late (only for check-in)
    const isLate = type === "check-in" && currentTime > latenessTime

    // Check if early departure (only for check-out)
    const isEarly = type === "check-out" && currentTime < earlyDepartureTime

    // Check for existing attendance record today
    const tenantDb = createTenantDatabase(db, finalTenantId)
    const existingRecord = await tenantDb.findOne<AttendanceLog>("attendance", {
      staffId,
      date: currentDate,
    })

    if (type === "check-in") {
      // Check if already checked in
      if (existingRecord && existingRecord.checkInTime) {
        return NextResponse.json(
          {
            error: "You have already checked in today",
            success: false
          },
          { status: 400 }
        )
      }

      // Create new attendance record for check-in
      const logData: any = {
        staffId,
        staffName: staff.name,
        department: staff.department,
        type: "check-in",
        status: isLate ? "late" : "present",
        method: method || "manual",
        checkInTime: now,
        checkInMethod: method || "manual",
        timestamp: now,
        date: currentDate,
        isLate: isLate || false,
      }

      // Add check-in photo if provided
      if (photo) {
        console.log("Uploading check-in photo to Cloudinary...")
        
        if (isCloudinaryConfigured()) {
          const uploadResult = await uploadCheckInPhoto(
            photo,
            staffId,
            finalTenantId
          )

          if (uploadResult.success && uploadResult.url) {
            logData.checkInPhoto = uploadResult.url
            logData.checkInPhotoPublicId = uploadResult.publicId
            logData.photosCapturedAt = now
            console.log("Check-in photo uploaded successfully:", uploadResult.url)
          } else {
            console.warn("Failed to upload check-in photo:", uploadResult.error)
            // Fallback: Store base64 if Cloudinary fails
            logData.checkInPhoto = photo
            logData.photosCapturedAt = now
          }
        } else {
          console.warn("Cloudinary not configured, storing base64")
          // Fallback: Store base64 if Cloudinary not configured
          logData.checkInPhoto = photo
          logData.photosCapturedAt = now
        }
      } else {
        console.log("No check-in photo provided")
      }

      await tenantDb.insertOne<AttendanceLog>("attendance", logData)
    } else {
      // Check-out: Update existing record
      if (!existingRecord) {
        return NextResponse.json(
          {
            error: "No check-in record found. Please check in first.",
            success: false
          },
          { status: 400 }
        )
      }

      if (existingRecord.checkOutTime) {
        return NextResponse.json(
          {
            error: "You have already checked out today",
            success: false
          },
          { status: 400 }
        )
      }

      // Update existing record with check-out info
      // Determine final status based on check-in and check-out
      let finalStatus = existingRecord.status || "present"
      if (existingRecord.isLate) {
        finalStatus = "late"
      } else if (isEarly) {
        finalStatus = "early"
      }

      const updateData: any = {
        type: "check-out", // Update type to check-out
        status: finalStatus,
        method: method || existingRecord.method || "manual", // Use check-out method or fallback to check-in method
        checkOutTime: now,
        checkOutMethod: method || "manual",
        isEarly: isEarly || false,
      }

      // Add check-out photo if provided
      if (photo) {
        console.log("Uploading check-out photo to Cloudinary...")
        
        if (isCloudinaryConfigured()) {
          const uploadResult = await uploadCheckOutPhoto(
            photo,
            staffId,
            finalTenantId
          )

          if (uploadResult.success && uploadResult.url) {
            updateData.checkOutPhoto = uploadResult.url
            updateData.checkOutPhotoPublicId = uploadResult.publicId
            if (!existingRecord.photosCapturedAt) {
              updateData.photosCapturedAt = now
            }
            console.log("Check-out photo uploaded successfully:", uploadResult.url)
          } else {
            console.warn("Failed to upload check-out photo:", uploadResult.error)
            // Fallback: Store base64 if Cloudinary fails
            updateData.checkOutPhoto = photo
            if (!existingRecord.photosCapturedAt) {
              updateData.photosCapturedAt = now
            }
          }
        } else {
          console.warn("Cloudinary not configured, storing base64")
          // Fallback: Store base64 if Cloudinary not configured
          updateData.checkOutPhoto = photo
          if (!existingRecord.photosCapturedAt) {
            updateData.photosCapturedAt = now
          }
        }
      } else {
        console.log("No check-out photo provided")
      }

      await tenantDb.updateOne<AttendanceLog>(
        "attendance",
        { staffId, date: currentDate },
        { $set: updateData }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${type === "check-in" ? "Checked in" : "Checked out"} successfully`,
      isLate,
      isEarly,
      staff: staff.name,
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({
      error: "Failed to process attendance",
      success: false
    }, { status: 500 })
  }
}
