/**
 * Attendance Logs API - lists attendance records (check-ins are recorded via /api/attendance/checkin)
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, TenantError } from "@/lib/types"
import { photoUrl } from "@/lib/services/photo-storage"

export const dynamic = 'force-dynamic'

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
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100") || 100, 1), 5000)

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
      checkInPhoto: photoUrl(log.checkInPhoto, context.tenantId, log.photosCapturedAt),
      checkOutPhoto: photoUrl(log.checkOutPhoto, context.tenantId, log.photosCapturedAt),
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
