import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUTCDateString, subtractDaysUTC } from "@/lib/utils/date"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    // Check feature access - Department analytics are Enterprise only (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can access department analytics (Enterprise only)
      if (!hasFeatureAccess(subscription.plan as any, "analyticsDepartment", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Department analytics are only available in the Enterprise plan. Upgrade to access team insights.",
            code: "FEATURE_LOCKED"
          },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"

    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    }
    const days = daysMap[range] || 30
    
    const startDate = subtractDaysUTC(new Date(), days)
    const startDateStr = getUTCDateString(startDate)

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
      // Only calculate if there's attendance, otherwise 0
      const punctualityScore = totalAttendance > 0
        ? Math.round(((totalAttendance - lateCount) / totalAttendance) * 100)
        : 0

      // Calculate trend by comparing with previous period
      const previousStartDate = subtractDaysUTC(startDate, days)
      const previousStartDateStr = getUTCDateString(previousStartDate)
      
      let calculatedTrend = 0

      return {
        name: dept.name,
        staffCount,
        attendanceRate: Math.min(attendanceRate, 100),
        punctualityScore,
        lateCount,
        trend: calculatedTrend,
      }
    })

    // Calculate trends separately by fetching previous period data
    const previousStartDate = subtractDaysUTC(startDate, days)
    const previousStartDateStr = getUTCDateString(previousStartDate)
    const previousRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: previousStartDateStr, $lt: startDateStr },
    })

    // Group previous records by department
    const previousDeptMap: Record<string, AttendanceLog[]> = {}
    previousRecords.forEach((record) => {
      const deptName = record.department || "Unassigned"
      if (!previousDeptMap[deptName]) {
        previousDeptMap[deptName] = []
      }
      previousDeptMap[deptName].push(record)
    })

    // Update trends for each department
    departmentData.forEach((dept) => {
      const prevRecords = previousDeptMap[dept.name] || []
      const prevCheckIns = prevRecords.filter((r) => r.checkInTime)
      const prevLateCount = prevRecords.filter((r) => r.checkInTime && r.isLate === true).length
      
      const previousPunctuality = prevCheckIns.length > 0
        ? ((prevCheckIns.length - prevLateCount) / prevCheckIns.length) * 100
        : 0
      
      // Only calculate trend if both periods have data
      if (dept.punctualityScore > 0 && previousPunctuality > 0) {
        dept.trend = Math.round((dept.punctualityScore - previousPunctuality) * 10) / 10
      } else {
        dept.trend = 0
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
