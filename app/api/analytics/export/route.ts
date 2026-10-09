import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { formatLocalTime, getAnalyticsRange, getCheckInTime, getCheckOutTime } from "@/lib/analytics/range"
import { toCsv } from "@/lib/utils/csv"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const rangeParam = request.nextUrl.searchParams.get("range")
    const range = await getAnalyticsRange(db, context.tenantId, rangeParam)

    const [records, staff] = await Promise.all([
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.start, $lte: range.end } }, {
        sort: { date: 1, staffName: 1 },
      }),
      tenantDb.find<Staff>("staff", {}),
    ])
    const staffMap = new Map(staff.map((s) => [s.staffId, s]))

    const rows = records.map((record) => {
      const checkIn = getCheckInTime(record)
      const checkOut = getCheckOutTime(record)
      const status = [record.isLate && "Late", record.isEarly && "Left early"].filter(Boolean).join(", ") || "On time"
      return [
        record.date,
        record.staffId,
        staffMap.get(record.staffId)?.name || record.staffName || "Unknown",
        staffMap.get(record.staffId)?.department || record.department || "N/A",
        checkIn ? formatLocalTime(checkIn, range.timezone) : "",
        checkOut ? formatLocalTime(checkOut, range.timezone) : "",
        status,
      ]
    })

    const csv = toCsv(["Date", "Staff ID", "Staff Name", "Department", "Check In", "Check Out", "Status"], rows)

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${range.start}-to-${range.end}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
