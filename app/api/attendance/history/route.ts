/**
 * Attendance History API - Get attendance records by date
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getOrganizationToday } from "@/lib/checkin/policy"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, TenantError } from "@/lib/types"
import { getCheckInTime, getCheckOutTime } from "@/lib/analytics/range"
import { photoUrl } from "@/lib/services/photo-storage"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const staffId = searchParams.get("staffId")

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    const today = await getOrganizationToday(db, context.tenantId)

    const query: any = {}
    if (date) {
      query.date = date
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate }
    } else {
      query.date = today
    }

    if (staffId) {
      query.staffId = staffId
    }

    const records = await tenantDb.find<AttendanceLog>("attendance", query)

    // Current records hold both check-in and check-out on one document (whose
    // type becomes "check-out" after checking out). Older data stored separate
    // documents per event, so merge by staff and date.
    type HistoryEntry = {
      staffId: string
      staffName: string
      department: string
      checkInTime?: Date
      checkOutTime?: Date
      isLate: boolean
      isEarly: boolean
      date: string
      checkInMethod?: string
      checkOutMethod?: string
      checkInPhoto?: string
      checkOutPhoto?: string
    }
    const byStaffAndDate = new Map<string, HistoryEntry>()

    for (const log of records) {
      const key = `${log.staffId}-${log.date}`
      const entry: HistoryEntry = byStaffAndDate.get(key) || {
        staffId: log.staffId,
        staffName: log.staffName,
        department: log.department,
        isLate: false,
        isEarly: false,
        date: log.date,
      }

      const checkInTime = getCheckInTime(log)
      const checkOutTime = getCheckOutTime(log)

      if (checkInTime && !entry.checkInTime) {
        entry.checkInTime = checkInTime
        entry.checkInMethod = log.checkInMethod || log.method
        entry.checkInPhoto = photoUrl(log.checkInPhoto, context.tenantId, log.photosCapturedAt)
      }
      if (checkOutTime) {
        entry.checkOutTime = checkOutTime
        entry.checkOutMethod = log.checkOutMethod || log.method
        entry.checkOutPhoto = photoUrl(log.checkOutPhoto, context.tenantId, log.photosCapturedAt)
      }
      entry.isLate = entry.isLate || !!log.isLate
      entry.isEarly = entry.isEarly || !!log.isEarly

      byStaffAndDate.set(key, entry)
    }

    const attendance = Array.from(byStaffAndDate.values()).filter((entry) => entry.checkInTime)

    // Newest first
    attendance.sort((a, b) => b.date.localeCompare(a.date) || b.checkInTime!.getTime() - a.checkInTime!.getTime())

    return NextResponse.json({
      success: true,
      attendance,
      filters: {
        date,
        startDate,
        endDate,
        staffId,
      },
    })
  } catch (error) {
    console.error("Attendance history error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    )
  }
}
