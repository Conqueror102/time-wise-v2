import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"

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

    // Get all staff
    const allStaff = await tenantDb.find<Staff>("staff", { isActive: true })

    // Get attendance records in range
    const attendanceRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
    })

    // Group attendance by staff
    const staffAttendanceMap: Record<string, AttendanceLog[]> = {}
    attendanceRecords.forEach((record) => {
      if (!staffAttendanceMap[record.staffId]) {
        staffAttendanceMap[record.staffId] = []
      }
      staffAttendanceMap[record.staffId].push(record)
    })

    // Calculate metrics for each staff member
    const staffData = allStaff.map((member) => {
      const attendance = staffAttendanceMap[member.staffId] || []
      const checkIns = attendance.filter((a) => a.type === "check-in")
      const totalAttendance = checkIns.length
      const lateCount = checkIns.filter((a) => a.isLate).length

      const attendanceRate = days > 0
        ? Math.round((totalAttendance / days) * 100)
        : 0

      const punctualityScore = totalAttendance > 0
        ? Math.round(((totalAttendance - lateCount) / totalAttendance) * 100)
        : 100

      let status = "Poor"
      if (attendanceRate >= 90 && punctualityScore >= 90) status = "Excellent"
      else if (attendanceRate >= 75 && punctualityScore >= 75) status = "Good"
      else if (attendanceRate >= 60 || punctualityScore >= 60) status = "Fair"

      return {
        staffId: member.staffId,
        name: member.name,
        department: member.department || "N/A",
        attendanceRate: Math.min(attendanceRate, 100),
        punctualityScore,
        lateCount,
        status,
      }
    })

    // Sort by attendance rate
    staffData.sort((a, b) => b.attendanceRate - a.attendanceRate)

    // Get top performers
    const topPerformers = {
      attendance: staffData[0] || null,
      punctual: [...staffData].sort((a, b) => b.punctualityScore - a.punctualityScore)[0] || null,
    }

    // Get staff needing attention
    const needsAttention = [...staffData]
      .sort((a, b) => b.lateCount - a.lateCount)[0] || null

    return NextResponse.json({
      staff: staffData,
      topPerformers,
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
