/**
 * Public Check-In/Out API (kiosk)
 *
 * Requires the kiosk token issued by /api/organization/verify-passcode; the
 * tenant is taken from that token. Only methods the admin enabled are accepted:
 * QR check-ins must include the signed QR payload for the same staff member,
 * and face check-ins the biometric proof issued when their face was recognised.
 * (Fingerprint punches arrive from attendance devices via /api/devices.)
 */

import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { verifyBiometricProof, verifyKioskRequest } from "@/lib/auth/checkin-tokens"
import { getCheckInPolicy } from "@/lib/checkin/policy"
import { verifyStaffQrPayload } from "@/lib/checkin/qr"
import { getZonedDateTime } from "@/lib/utils/date"
import { storeAttendancePhoto } from "@/lib/services/photo-storage"
import { searchFace } from "@/lib/services/face-recognition"

export const dynamic = 'force-dynamic'

const MAX_PHOTO_BASE64_LENGTH = 8 * 1024 * 1024
const METHODS = ["manual", "qr", "face"] as const

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = verifyKioskRequest(request)
    const body = await request.json()
    const staffId = typeof body.staffId === "string" ? body.staffId.trim().toUpperCase() : ""
    const { type, photo, biometricProofs } = body
    const method = METHODS.includes(body.method) ? body.method : "manual"

    if (!staffId || (type !== "check-in" && type !== "check-out")) {
      return NextResponse.json({ error: "Staff ID and type are required" }, { status: 400 })
    }

    if (photo !== undefined && (typeof photo !== "string" || photo.length > MAX_PHOTO_BASE64_LENGTH)) {
      return NextResponse.json({ error: "Invalid photo" }, { status: 400 })
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, tenantId)
    const staff = await tenantDb.findOne<Staff>("staff", { staffId })

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    if (!staff.isActive) {
      return NextResponse.json({ error: "Staff member is inactive" }, { status: 403 })
    }

    const organization = await db
      .collection("organizations")
      .findOne({ _id: new ObjectId(tenantId) })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const policy = getCheckInPolicy(organization)

    // Only the methods the admin allows, each with its own proof:
    // manual = staff ID, qr = a signed QR code for this person, face = a recognition proof
    const allowed = {
      manual: policy.enabledCheckInMethods.manualEntry,
      qr: policy.enabledCheckInMethods.qrCode,
      face: policy.enabledCheckInMethods.faceRecognition,
    }[method as "manual" | "qr" | "face"]
    if (!allowed) {
      return NextResponse.json(
        { error: "This check-in method has been disabled by your administrator", success: false },
        { status: 403 }
      )
    }

    if (method === "qr" && verifyStaffQrPayload(body.qrData, tenantId) !== staffId) {
      return NextResponse.json(
        { error: "This QR code is not valid. Ask your administrator for a new one.", success: false },
        { status: 401 }
      )
    }

    // Face check-ins must carry the proof issued when the face was recognised
    const requiredMethods: "face"[] = method === "face" ? ["face"] : []

    if (requiredMethods.length > 0) {
      const verifiedMethods = new Set<string>()
      for (const token of Array.isArray(biometricProofs) ? biometricProofs : []) {
        try {
          const proof = verifyBiometricProof(token)
          if (proof.tenantId === tenantId && proof.staffId === staffId) verifiedMethods.add(proof.method)
        } catch {
          // ignore invalid or expired proofs
        }
      }
      if (!requiredMethods.every((m) => verifiedMethods.has(m))) {
        return NextResponse.json(
          { error: "Biometric verification is required", success: false },
          { status: 401 }
        )
      }
    }

    if (policy.requirePhoto && !photo) {
      return NextResponse.json(
        { error: "Photo verification is required", success: false },
        { status: 400 }
      )
    }

    // QR and Staff ID check-ins: make sure the person at the kiosk is the staff
    // member whose code or ID was used, when they have a registered face
    let faceVerification: "matched" | "not-registered" | "unavailable" | undefined
    if (policy.verifyFaceOnIdCheckIn && (method === "qr" || method === "manual")) {
      if (!staff.faceData) {
        faceVerification = "not-registered"
      } else {
        const match = await searchFace(photo, tenantId)
        if (match.success && match.staffId === staffId) {
          faceVerification = "matched"
        } else if (match.noFace) {
          return NextResponse.json(
            { error: "No face visible. Look at the camera and try again.", success: false },
            { status: 422 }
          )
        } else if (match.success || match.faceWidthRatio !== undefined) {
          // A face was seen but it isn't this staff member
          return NextResponse.json(
            { error: `Face doesn't match ${method === "qr" ? "this QR code" : "this Staff ID"}`, success: false },
            { status: 401 }
          )
        } else {
          // Recognition service unavailable: don't lock staff out, but record it
          faceVerification = "unavailable"
        }
      }
    }

    // Lateness and the attendance date follow the organization's local time
    const now = new Date()
    const { date: currentDate, time: currentTime } = getZonedDateTime(now, policy.timezone)
    const isLate = type === "check-in" && currentTime > policy.latenessTime
    const isEarly = type === "check-out" && currentTime < policy.earlyDepartureTime

    const existingRecord = await tenantDb.findOne<AttendanceLog>("attendance", {
      staffId,
      date: currentDate,
    })

    if (type === "check-in") {
      if (existingRecord && existingRecord.checkInTime) {
        return NextResponse.json(
          { error: "You have already checked in today", success: false },
          { status: 400 }
        )
      }

      const logData: any = {
        staffId,
        staffName: staff.name,
        department: staff.department,
        type: "check-in",
        status: isLate ? "late" : "present",
        method,
        checkInTime: now,
        checkInMethod: method,
        timestamp: now,
        date: currentDate,
        isLate,
      }

      if (faceVerification) logData.checkInFaceVerification = faceVerification

      if (photo && policy.capturePhotos) {
        const stored = await storeAttendancePhoto(db, photo, "check-in", tenantId, staffId)
        logData.photosCapturedAt = now
        if (stored.ref) {
          logData.checkInPhoto = stored.ref
          logData.checkInPhotoPublicId = stored.publicId
        } else {
          logData.photoUploadFailed = true
        }
      }

      await tenantDb.insertOne<AttendanceLog>("attendance", logData)
    } else {
      if (!existingRecord) {
        return NextResponse.json(
          { error: "No check-in record found. Please check in first.", success: false },
          { status: 400 }
        )
      }

      if (existingRecord.checkOutTime) {
        return NextResponse.json(
          { error: "You have already checked out today", success: false },
          { status: 400 }
        )
      }

      let finalStatus = existingRecord.status || "present"
      if (existingRecord.isLate) {
        finalStatus = "late"
      } else if (isEarly) {
        finalStatus = "early"
      }

      const updateData: any = {
        type: "check-out",
        status: finalStatus,
        method,
        checkOutTime: now,
        checkOutMethod: method,
        isEarly,
      }

      if (faceVerification) updateData.checkOutFaceVerification = faceVerification

      if (photo && policy.capturePhotos) {
        const stored = await storeAttendancePhoto(db, photo, "check-out", tenantId, staffId)
        if (!existingRecord.photosCapturedAt) {
          updateData.photosCapturedAt = now
        }
        if (stored.ref) {
          updateData.checkOutPhoto = stored.ref
          updateData.checkOutPhotoPublicId = stored.publicId
        } else {
          updateData.photoUploadFailed = true
        }
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
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message, success: false }, { status: error.statusCode })
    }
    console.error("Check-in error:", error)
    return NextResponse.json({
      error: "Failed to process attendance",
      success: false
    }, { status: 500 })
  }
}
