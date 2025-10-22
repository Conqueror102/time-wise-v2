/**
 * Attendance Check-In/Out API - Multi-tenant aware
 */

import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, CheckInRequest, TenantError, QRCodeData } from "@/lib/types"

/**
 * Decode QR code data
 */
function decodeQRData(qrData: string): QRCodeData | null {
  try {
    const decoded = Buffer.from(qrData, "base64").toString("utf-8")
    return JSON.parse(decoded) as QRCodeData
  } catch {
    return null
  }
}

/**
 * Check if check-in is late based on organization settings
 */
function isLateCheckIn(timestamp: Date, latenessTime: string): boolean {
  const [hours, minutes] = latenessTime.split(":").map(Number)
  const checkInTime = timestamp.getHours() * 60 + timestamp.getMinutes()
  const latenessMinutes = hours * 60 + minutes
  return checkInTime > latenessMinutes
}

/**
 * POST - Check in or check out
 */
export async function POST(request: NextRequest) {
  try {
    const context = await withAuth(request)
    const body: CheckInRequest = await request.json()
    const { staffId, qrData, method, type } = body

    // Validate required fields
    if (!method || !type) {
      return NextResponse.json(
        { error: "Method and type are required" },
        { status: 400 }
      )
    }

    if (method === "manual" && !staffId) {
      return NextResponse.json(
        { error: "Staff ID is required for manual check-in" },
        { status: 400 }
      )
    }

    if (method === "qr" && !qrData) {
      return NextResponse.json(
        { error: "QR data is required for QR check-in" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    let finalStaffId = staffId

    // If QR method, decode and validate
    if (method === "qr" && qrData) {
      const decoded = decodeQRData(qrData)
      
      if (!decoded) {
        return NextResponse.json(
          { error: "Invalid QR code format" },
          { status: 400 }
        )
      }

      // Verify tenant matches
      if (decoded.tenantId !== context.tenantId) {
        return NextResponse.json(
          { error: "QR code belongs to a different organization" },
          { status: 403 }
        )
      }

      finalStaffId = decoded.staffId
    }

    // Find staff member
    const staff = await tenantDb.findOne<Staff>("staff", { staffId: finalStaffId })

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      )
    }

    if (!staff.isActive) {
      return NextResponse.json(
        { error: "Staff member is inactive" },
        { status: 403 }
      )
    }

    const timestamp = new Date()
    const dateStr = timestamp.toISOString().split("T")[0] // YYYY-MM-DD

    // Get organization settings for lateness check
    const organization = await db
      .collection("organizations")
      .findOne({ _id: new ObjectId(context.tenantId) })

    const latenessTime = organization?.settings?.latenessTime || "09:00"
    const isLate = type === "check-in" ? isLateCheckIn(timestamp, latenessTime) : false

    // Check for existing log today
    const existingLog = await tenantDb.findOne<AttendanceLog>("attendance", {
      staffId: finalStaffId,
      date: dateStr,
      type,
    })

    if (existingLog) {
      return NextResponse.json(
        { error: `Staff has already ${type === "check-in" ? "checked in" : "checked out"} today` },
        { status: 400 }
      )
    }

    // Determine status
    const status = isLate ? "late" : "present"

    // Create attendance log
    const attendanceLog = await tenantDb.insertOne<AttendanceLog>("attendance", {
      staffId: staff.staffId,
      staffName: staff.name,
      department: staff.department,
      type,
      status,
      timestamp,
      date: dateStr,
      isLate,
      method,
    } as any)

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "check-in" ? "checked in" : "checked out"}`,
      attendance: attendanceLog,
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        department: staff.department,
      },
      isLate,
    })
  } catch (error) {
    console.error("Attendance error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to process attendance" },
      { status: 500 }
    )
  }
}

/**
 * GET - Get attendance logs
 */
export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const staffId = searchParams.get("staffId")
    const limit = parseInt(searchParams.get("limit") || "100")

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Build filter
    const filter: any = {}
    if (date) filter.date = date
    if (staffId) filter.staffId = staffId

    // Get attendance logs
    const rawLogs = await tenantDb.find<AttendanceLog>("attendance", filter, {
      sort: { timestamp: -1 },
      limit,
    })

    // Normalize logs to ensure all have required fields
    const logs = rawLogs.map(log => ({
      ...log,
      // Ensure type field exists (fallback to check-in for legacy records)
      type: log.type || (log.checkInTime ? "check-in" : log.checkOutTime ? "check-out" : "check-in"),
      // Ensure status field exists
      status: log.status || (log.isLate ? "late" : log.isEarly ? "early" : "present"),
      // Ensure method field exists
      method: log.method || log.checkInMethod || log.checkOutMethod || "manual",
      // Use timestamp or fallback to checkInTime/checkOutTime for legacy records
      timestamp: log.timestamp || log.checkInTime || log.checkOutTime || new Date(),
    }))

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    })
  } catch (error) {
    console.error("Get attendance error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch attendance logs" },
      { status: 500 }
    )
  }
}
