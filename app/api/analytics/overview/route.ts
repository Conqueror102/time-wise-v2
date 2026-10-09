import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { getAnalyticsRange, getWorkingDays, isCheckIn, percent } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const range = await getAnalyticsRange(db, context.tenantId, request.nextUrl.searchParams.get("range"))

    const activeStaff = await tenantDb.find<Staff>("staff", { isActive: true })
    const totalStaff = activeStaff.length

    const [records, previousRecords] = await Promise.all([
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.start, $lte: range.end } }),
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.previousStart, $lte: range.previousEnd } }),
    ])

    const checkIns = records.filter(isCheckIn)
    const lateArrivals = checkIns.filter((r) => r.isLate === true).length
    const earlyDepartures = records.filter((r) => r.isEarly === true).length

    // Attendance rate = check-ins / (active staff × days the organization was open)
    const averageAttendanceRate = percent(checkIns.length, totalStaff * getWorkingDays(records).size)

    const previousCheckIns = previousRecords.filter(isCheckIn)
    const previousAttendanceRate = percent(previousCheckIns.length, totalStaff * getWorkingDays(previousRecords).size)
    const previousLateCount = previousCheckIns.filter((r) => r.isLate === true).length

    // Active staff who have not checked in today
    const checkedInToday = new Set(checkIns.filter((r) => r.date === range.end).map((r) => r.staffId))
    const absentees = activeStaff.filter((s) => !checkedInToday.has(s.staffId)).length

    // Lateness trend is the percentage change in the number of late arrivals
    const latenessTrend = previousLateCount > 0
      ? Math.round(((lateArrivals - previousLateCount) / previousLateCount) * 100)
      : lateArrivals > 0 ? 100 : 0

    return NextResponse.json({
      totalStaff,
      totalAttendance: checkIns.length,
      averageAttendanceRate,
      lateArrivals,
      earlyDepartures,
      absentees,
      trends: {
        attendance: averageAttendanceRate - previousAttendanceRate,
        lateness: latenessTrend,
      },
    })
  } catch (error) {
    console.error("Analytics overview error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
