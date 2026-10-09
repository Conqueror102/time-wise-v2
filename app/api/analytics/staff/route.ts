import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { getAnalyticsRange, getJoinDate, getWorkingDays, isCheckIn, percent } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'

function statusFor(attendanceRate: number, punctualityScore: number, attended: number): string {
  if (attended === 0) return "Absent"
  if (attendanceRate >= 90 && punctualityScore >= 90) return "Excellent"
  if (attendanceRate >= 75 && punctualityScore >= 75) return "Good"
  if (attendanceRate >= 50) return "Fair"
  if (attendanceRate >= 25) return "Poor"
  return "Very Poor"
}

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const range = await getAnalyticsRange(db, context.tenantId, request.nextUrl.searchParams.get("range"))

    const [activeStaff, records] = await Promise.all([
      tenantDb.find<Staff>("staff", { isActive: true }),
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.start, $lte: range.end } }),
    ])

    const workingDays = [...getWorkingDays(records)]

    const checkInsByStaff: Record<string, AttendanceLog[]> = {}
    for (const record of records) {
      if (isCheckIn(record)) (checkInsByStaff[record.staffId] ??= []).push(record)
    }

    const staff = activeStaff.map((member) => {
      const checkIns = checkInsByStaff[member.staffId] || []
      const attendedDays = new Set(checkIns.map((r) => r.date)).size
      const lateCount = checkIns.filter((r) => r.isLate === true).length

      // Only count days the organization was open after this person was added
      const joined = getJoinDate(member.createdAt, range.timezone)
      const expectedDays = workingDays.filter((d) => !joined || d >= joined).length

      const attendanceRate = percent(attendedDays, expectedDays)
      const punctualityScore = percent(checkIns.length - lateCount, checkIns.length)

      return {
        staffId: member.staffId,
        name: member.name,
        department: member.department || "N/A",
        attendanceRate,
        punctualityScore,
        lateCount,
        status: statusFor(attendanceRate, punctualityScore, attendedDays),
      }
    })

    staff.sort((a, b) => b.attendanceRate - a.attendanceRate || b.punctualityScore - a.punctualityScore)

    const attended = staff.filter((s) => s.attendanceRate > 0)
    const mostPunctual = [...attended].sort(
      (a, b) => b.punctualityScore - a.punctualityScore || b.attendanceRate - a.attendanceRate
    )[0] || null
    const needsAttention = attended
      .filter((s) => s.lateCount > 0)
      .sort((a, b) => b.lateCount - a.lateCount || a.attendanceRate - b.attendanceRate)[0] || null

    return NextResponse.json({
      staff,
      topPerformers: {
        attendance: attended[0] || null,
        punctual: mostPunctual,
      },
      needsAttention,
    })
  } catch (error) {
    console.error("Analytics staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch staff data" }, { status: 500 })
  }
}
