/**
 * Dashboard Statistics API - Multi-tenant aware
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { hasFeatureAccess } from "@/lib/features/feature-access"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Check if user has access to reports/history
    const canAccessReports = await hasFeatureAccess(
      context.tenantId,
      "canAccessHistory",
      process.env.NODE_ENV === "development"
    )

    if (!canAccessReports) {
      return NextResponse.json(
        { error: "This feature requires a paid subscription plan" },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    // Get total staff count
    const totalStaff = await tenantDb.count<Staff>("staff", { isActive: true })

    // Get today's attendance records
    const todayAttendance = await tenantDb.find<AttendanceLog>("attendance", {
      date: today,
    })

    // Get staff who checked in (have checkInTime)
    const checkedInToday = todayAttendance.filter((log) => log.checkInTime)

    // Get current staff (checked in but not checked out)
    const currentStaff = todayAttendance.filter((log) => log.checkInTime && !log.checkOutTime)

    // Get late arrivals today (only those who actually checked in late)
    const lateToday = todayAttendance.filter((log) => log.checkInTime && log.isLate === true)

    // Get absent staff
    const checkedInStaffIds = new Set(checkedInToday.map((log) => log.staffId))
    const allStaff = await tenantDb.find<Staff>("staff", { isActive: true })
    const absentStaff = allStaff.filter((staff) => !checkedInStaffIds.has(staff.staffId))

    // Get early departures today (only those who actually checked out early)
    const earlyDepartures = todayAttendance.filter((log) => log.checkOutTime && log.isEarly === true)

    return NextResponse.json({
      success: true,
      stats: {
        totalStaff,
        presentToday: checkedInToday.length,
        currentlyPresent: currentStaff.length,
        lateToday: lateToday.length,
        absentToday: absentStaff.length,
        earlyDepartureToday: earlyDepartures.length,
      },
      currentStaff: currentStaff.map((log) => ({
        staffId: log.staffId,
        name: log.staffName,
        department: log.department,
        checkInTime: log.checkInTime || log.timestamp,
        isLate: log.isLate,
      })),
      absentStaff: absentStaff.map((staff) => ({
        staffId: staff.staffId,
        name: staff.name,
        department: staff.department,
      })),
      earlyDepartures: earlyDepartures.map((log) => ({
        staffId: log.staffId,
        name: log.staffName,
        department: log.department,
        checkOutTime: log.checkOutTime || log.timestamp,
        isEarly: log.isEarly,
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
