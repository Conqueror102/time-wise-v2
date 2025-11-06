import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"

    // Calculate date range
    const now = new Date()
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    }
    const days = daysMap[range] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const startDateStr = startDate.toISOString().split("T")[0]

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Get total staff count
    const totalStaff = await tenantDb.count<Staff>("staff", { isActive: true })

    // Get attendance records in range
    const attendanceRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
    })

    // Calculate stats - only count records with actual check-ins
    const recordsWithCheckIn = attendanceRecords.filter((r) => r.checkInTime)
    const totalAttendance = recordsWithCheckIn.length
    const lateArrivals = attendanceRecords.filter((r) => r.checkInTime && r.isLate === true).length
    const earlyDepartures = attendanceRecords.filter((r) => r.checkOutTime && r.isEarly === true).length

    // Calculate average attendance rate
    const uniqueStaffAttended = new Set(recordsWithCheckIn.map((r) => r.staffId)).size
    const averageAttendanceRate = totalStaff > 0 ? Math.round((uniqueStaffAttended / totalStaff) * 100) : 0

    // Calculate absentees (staff who haven't checked in today)
    const today = new Date().toISOString().split("T")[0]
    const todayRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: today,
    })
    const todayAttendance = todayRecords.filter((r) => r.checkInTime).length
    const absentees = totalStaff - todayAttendance

    // Calculate trends (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDateStr = previousStartDate.toISOString().split("T")[0]
    const previousRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: previousStartDateStr, $lt: startDateStr },
    })

    const previousRecordsWithCheckIn = previousRecords.filter((r) => r.checkInTime)
    const previousAttendanceRate = totalStaff > 0
      ? (new Set(previousRecordsWithCheckIn.map((r) => r.staffId)).size / totalStaff) * 100
      : 0
    const attendanceTrend = averageAttendanceRate - previousAttendanceRate

    const previousLateCount = previousRecords.filter((r) => r.checkInTime && r.isLate === true).length
    const previousLateRate = previousRecordsWithCheckIn.length > 0
      ? (previousLateCount / previousRecordsWithCheckIn.length) * 100
      : 0
    const currentLateRate = totalAttendance > 0 ? (lateArrivals / totalAttendance) * 100 : 0
    const latenessTrend = currentLateRate - previousLateRate

    return NextResponse.json({
      totalStaff,
      totalAttendance,
      averageAttendanceRate,
      lateArrivals,
      earlyDepartures,
      absentees,
      trends: {
        attendance: Math.round(attendanceTrend * 10) / 10,
        lateness: Math.round(latenessTrend * 10) / 10,
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
