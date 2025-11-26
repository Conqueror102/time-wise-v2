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

    // Check feature access (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can access analytics
      if (!hasFeatureAccess(subscription.plan as any, "canAccessAnalytics", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Analytics are locked. Upgrade to Professional or Enterprise to access analytics.",
            code: "FEATURE_LOCKED"
          },
          { status: 403 }
        )
      }

      // Check if can access overview analytics
      if (!hasFeatureAccess(subscription.plan as any, "analyticsOverview", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Overview analytics are not available in your plan. Upgrade to access this feature.",
            code: "FEATURE_LOCKED"
          },
          { status: 403 }
        )
      }
    }

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

    // Calculate average attendance rate: (total check-ins / (total staff × days)) × 100
    const expectedCheckIns = totalStaff * days
    const averageAttendanceRate = expectedCheckIns > 0 
      ? Math.round((totalAttendance / expectedCheckIns) * 100) 
      : 0

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
    const previousExpectedCheckIns = totalStaff * days
    const previousAttendanceRate = previousExpectedCheckIns > 0
      ? (previousRecordsWithCheckIn.length / previousExpectedCheckIns) * 100
      : 0
    const attendanceTrend = averageAttendanceRate - previousAttendanceRate

    const previousLateCount = previousRecords.filter((r) => r.checkInTime && r.isLate === true).length
    
    // Calculate lateness trend as percentage change in COUNT (not rate)
    const latenessTrend = previousLateCount > 0
      ? Math.round(((lateArrivals - previousLateCount) / previousLateCount) * 100)
      : (lateArrivals > 0 ? 100 : 0) // If no previous lates but have current lates, show 100% increase

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
