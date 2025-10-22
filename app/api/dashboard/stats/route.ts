/**
 * Dashboard Statistics API - Multi-tenant aware
 */

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

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    const today = new Date().toISOString().split("T")[0]

    // Get total staff count
    const totalStaff = await tenantDb.count<Staff>("staff", { isActive: true })

    // Get today's check-ins
    const checkedInToday = await tenantDb.find<AttendanceLog>("attendance", {
      date: today,
      type: "check-in",
    })

    // Get current staff (checked in but not checked out)
    const checkedOutToday = await tenantDb.find<AttendanceLog>("attendance", {
      date: today,
      type: "check-out",
    })

    const checkedOutStaffIds = new Set(checkedOutToday.map((log) => log.staffId))
    const currentStaff = checkedInToday.filter((log) => !checkedOutStaffIds.has(log.staffId))

    // Get late arrivals today
    const lateToday = checkedInToday.filter((log) => log.isLate)

    // Get absent staff
    const checkedInStaffIds = new Set(checkedInToday.map((log) => log.staffId))
    const allStaff = await tenantDb.find<Staff>("staff", { isActive: true })
    const absentStaff = allStaff.filter((staff) => !checkedInStaffIds.has(staff.staffId))

    // Get early departures today
    const earlyDepartures = checkedOutToday.filter((log) => log.isEarly)

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
        checkInTime: log.timestamp,
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
        checkOutTime: log.timestamp,
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
