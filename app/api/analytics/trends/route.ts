import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, Staff, TenantError } from "@/lib/types"
import { addDays, getAnalyticsRange, getCheckOutTime, getJoinDate, isCheckIn } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Monday-based weekday index (0 = Mon … 6 = Sun) of a "YYYY-MM-DD" date */
function weekdayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const range = await getAnalyticsRange(db, context.tenantId, request.nextUrl.searchParams.get("range"))

    // The weekly comparison always needs the last 14 days, even for the 7-day range
    const fetchFrom = [range.start, addDays(range.end, -13)].sort()[0]
    const [records, activeStaff] = await Promise.all([
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: fetchFrom, $lte: range.end } }),
      tenantDb.find<Staff>("staff", { isActive: true }),
    ])

    const byDate: Record<string, { checkIns: number; checkOuts: number; onTime: number; late: number }> = {}
    for (const record of records) {
      const day = (byDate[record.date] ??= { checkIns: 0, checkOuts: 0, onTime: 0, late: 0 })
      if (isCheckIn(record)) {
        day.checkIns++
        if (record.isLate === true) day.late++
        else day.onTime++
      }
      if (getCheckOutTime(record)) day.checkOuts++
    }

    const labels: string[] = []
    const checkIns: number[] = []
    const checkOuts: number[] = []
    const onTime: number[] = []
    const late: number[] = []
    const absent: number[] = []

    for (const date of range.dates) {
      const [y, m, d] = date.split("-").map(Number)
      labels.push(new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }))
      const day = byDate[date] ?? { checkIns: 0, checkOuts: 0, onTime: 0, late: 0 }
      checkIns.push(day.checkIns)
      checkOuts.push(day.checkOuts)
      onTime.push(day.onTime)
      late.push(day.late)

      // Absences only count on days the organization was open, for staff who had joined by then
      const staffOnDay = activeStaff.filter((s) => {
        const joined = getJoinDate(s.createdAt, range.timezone)
        return !joined || joined <= date
      }).length
      absent.push(day.checkIns > 0 ? Math.max(0, staffOnDay - day.checkIns) : 0)
    }

    // Check-ins per weekday: last 7 days vs the 7 days before
    const thisWeekStart = addDays(range.end, -6)
    const lastWeekStart = addDays(range.end, -13)
    const thisWeek = new Array(7).fill(0)
    const lastWeek = new Array(7).fill(0)
    for (const record of records) {
      if (!isCheckIn(record)) continue
      if (record.date >= thisWeekStart) thisWeek[weekdayIndex(record.date)]++
      else if (record.date >= lastWeekStart) lastWeek[weekdayIndex(record.date)]++
    }

    return NextResponse.json({
      labels,
      checkIns,
      checkOuts,
      onTime,
      late,
      absent,
      weeklyLabels: WEEKDAY_LABELS,
      thisWeek,
      lastWeek,
    })
  } catch (error) {
    console.error("Analytics trends error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 })
  }
}
