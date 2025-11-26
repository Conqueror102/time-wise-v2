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

    // Check feature access - Staff performance analytics are Enterprise only (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can access staff performance analytics (Enterprise only)
      if (!hasFeatureAccess(subscription.plan as any, "analyticsPerformance", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Staff performance analytics are only available in the Enterprise plan. Upgrade to access detailed reports.",
            code: "FEATURE_LOCKED"
          },
          { status: 403 }
        )
      }
    }

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
      
      // Filter for actual check-ins (records with checkInTime)
      const checkIns = attendance.filter((a) => a.checkInTime)
      const totalAttendance = checkIns.length
      const lateCount = attendance.filter((a) => a.checkInTime && a.isLate === true).length

      // Attendance rate: (days attended / total days) × 100
      const attendanceRate = days > 0
        ? Math.round((totalAttendance / days) * 100)
        : 0

      // Punctuality score: (on-time arrivals / total check-ins) × 100
      // Only calculate if they have attendance, otherwise N/A (0)
      const punctualityScore = totalAttendance > 0
        ? Math.round(((totalAttendance - lateCount) / totalAttendance) * 100)
        : 0

      // Determine status based on attendance primarily
      let status = "Absent"
      if (totalAttendance === 0 || attendanceRate === 0) {
        status = "Absent"
      } else if (attendanceRate >= 90 && punctualityScore >= 90) {
        status = "Excellent"
      } else if (attendanceRate >= 75 && punctualityScore >= 75) {
        status = "Good"
      } else if (attendanceRate >= 50) {
        status = "Fair"
      } else if (attendanceRate >= 25) {
        status = "Poor"
      } else if (attendanceRate > 0) {
        status = "Very Poor"
      }

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

    // Sort by attendance rate (with secondary sort by punctuality for ties)
    staffData.sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate
      }
      return b.punctualityScore - a.punctualityScore
    })

    // Get top performers - only from staff who actually attended
    const staffWithAttendance = staffData.filter(s => s.attendanceRate > 0)
    
    // Best attendance (with punctuality as tiebreaker)
    const bestAttendance = staffWithAttendance[0] || null
    
    // Most punctual (with attendance as tiebreaker)
    const mostPunctual = [...staffWithAttendance].sort((a, b) => {
      if (b.punctualityScore !== a.punctualityScore) {
        return b.punctualityScore - a.punctualityScore
      }
      return b.attendanceRate - a.attendanceRate
    })[0] || null
    
    const topPerformers = {
      attendance: bestAttendance,
      punctual: mostPunctual,
    }

    // Get staff needing attention - most late arrivals (with attendance as tiebreaker)
    const needsAttention = [...staffWithAttendance]
      .filter(s => s.lateCount > 0)
      .sort((a, b) => {
        if (b.lateCount !== a.lateCount) {
          return b.lateCount - a.lateCount
        }
        return a.attendanceRate - b.attendanceRate // Lower attendance is worse
      })[0] || null

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
