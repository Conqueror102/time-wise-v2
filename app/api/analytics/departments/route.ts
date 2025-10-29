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

    // Group staff by department
    const departmentMap: Record<string, {
      name: string
      staff: Staff[]
      attendance: AttendanceLog[]
    }> = {}

    allStaff.forEach((staff) => {
      const deptName = staff.department || "Unassigned"
      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          name: deptName,
          staff: [],
          attendance: [],
        }
      }
      departmentMap[deptName].staff.push(staff)
    })

    // Group attendance by department
    attendanceRecords.forEach((record) => {
      const deptName = record.department || "Unassigned"
      if (departmentMap[deptName]) {
        departmentMap[deptName].attendance.push(record)
      }
    })

    // Calculate metrics for each department
    const departmentData = Object.values(departmentMap).map((dept) => {
      const staffCount = dept.staff.length
      
      // Filter for actual check-ins (records with checkInTime)
      const checkIns = dept.attendance.filter((a) => a.checkInTime)
      const totalAttendance = checkIns.length
      const lateCount = dept.attendance.filter((a) => a.checkInTime && a.isLate === true).length

      // Calculate attendance rate: (total check-ins) / (staff count × days in range) × 100
      const attendanceRate = staffCount > 0 && days > 0
        ? Math.round((totalAttendance / (staffCount * days)) * 100)
        : 0

      // Calculate punctuality score: (on-time check-ins) / (total check-ins) × 100
      const punctualityScore = totalAttendance > 0
        ? Math.round(((totalAttendance - lateCount) / totalAttendance) * 100)
        : 100

      // Calculate trend by comparing with previous period
      const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
      const previousStartDateStr = previousStartDate.toISOString().split("T")[0]
      const previousRecords = attendanceRecords.filter((r) => 
        r.department === dept.name && 
        r.date >= previousStartDateStr && 
        r.date < startDateStr &&
        r.checkInTime
      )
      const previousLateCount = previousRecords.filter((r) => r.isLate === true).length
      const previousPunctuality = previousRecords.length > 0
        ? ((previousRecords.length - previousLateCount) / previousRecords.length) * 100
        : 100
      
      const trend = Math.round((punctualityScore - previousPunctuality) * 10) / 10

      return {
        name: dept.name,
        staffCount,
        attendanceRate: Math.min(attendanceRate, 100),
        punctualityScore,
        lateCount,
        trend,
      }
    })

    return NextResponse.json({
      departments: departmentData,
    })
  } catch (error) {
    console.error("Analytics departments error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch department data" }, { status: 500 })
  }
}
