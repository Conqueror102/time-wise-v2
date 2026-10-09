import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, TenantError } from "@/lib/types"
import { formatLocalTime, getAnalyticsRange, getCheckInTime, isCheckIn, minutesAfter } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const range = await getAnalyticsRange(db, context.tenantId, request.nextUrl.searchParams.get("range"))

    const organization = await db.collection("organizations").findOne({
      _id: new ObjectId(context.tenantId),
    })
    const latenessTime: string = organization?.settings?.latenessTime || "09:00"

    const [records, previousRecords] = await Promise.all([
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.start, $lte: range.end } }),
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.previousStart, $lte: range.previousEnd } }),
    ])

    const checkIns = records.filter(isCheckIn)
    const lateRecords = checkIns
      .filter((r) => r.isLate === true)
      .map((record) => {
        const checkInTime = getCheckInTime(record)!
        // Delay is measured in the organization's local time against the lateness threshold
        return { record, checkInTime, delay: Math.max(0, minutesAfter(checkInTime, latenessTime, range.timezone)) }
      })

    // Distribution by delay: 0-15, 15-30, 30-60, 60+ minutes
    const distribution = [0, 0, 0, 0]
    let totalDelay = 0
    for (const { delay } of lateRecords) {
      totalDelay += delay
      if (delay <= 15) distribution[0]++
      else if (delay <= 30) distribution[1]++
      else if (delay <= 60) distribution[2]++
      else distribution[3]++
    }

    const lateCountByStaff: Record<string, { staffId: string; name: string; count: number }> = {}
    for (const { record } of lateRecords) {
      const entry = (lateCountByStaff[record.staffId] ??= {
        staffId: record.staffId,
        name: record.staffName || record.staffId,
        count: 0,
      })
      entry.count++
    }
    const topLateStaff = Object.values(lateCountByStaff)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Trend compares the share of late check-ins with the previous period
    const previousCheckIns = previousRecords.filter(isCheckIn)
    const previousLate = previousCheckIns.filter((r) => r.isLate === true).length
    const currentRate = checkIns.length > 0 ? (lateRecords.length / checkIns.length) * 100 : 0
    const previousRate = previousCheckIns.length > 0 ? (previousLate / previousCheckIns.length) * 100 : 0

    const [th, tm] = latenessTime.split(":").map(Number)
    const expectedTime = new Date(Date.UTC(2000, 0, 1, th, tm)).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })

    const recentLate = [...lateRecords]
      .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime())
      .slice(0, 20)
      .map(({ record, checkInTime, delay }) => ({
        staffName: record.staffName || record.staffId,
        department: record.department || "N/A",
        date: record.date,
        expectedTime,
        actualTime: formatLocalTime(checkInTime, range.timezone),
        delay,
      }))

    return NextResponse.json({
      totalLate: lateRecords.length,
      latePercentage: Math.round(currentRate * 10) / 10,
      averageDelay: lateRecords.length > 0 ? Math.round(totalDelay / lateRecords.length) : 0,
      trend: Math.round((currentRate - previousRate) * 10) / 10,
      distribution,
      topLateStaff,
      recentLate,
    })
  } catch (error) {
    console.error("Analytics lateness error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch lateness data" }, { status: 500 })
  }
}
