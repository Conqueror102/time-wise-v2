/**
 * Dashboard Statistics API - today's attendance for the dashboard and report pages
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getOrganizationToday } from "@/lib/checkin/policy"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { getCheckInTime, getCheckOutTime } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const today = await getOrganizationToday(db, context.tenantId)

    const [activeStaff, todayRecords] = await Promise.all([
      tenantDb.find<Staff>("staff", { isActive: true }),
      tenantDb.find<AttendanceLog>("attendance", { date: today }),
    ])

    // One entry per staff member who checked in today, newest first
    const present = todayRecords
      .map((log) => ({ log, checkInTime: getCheckInTime(log), checkOutTime: getCheckOutTime(log) }))
      .filter((entry): entry is typeof entry & { checkInTime: Date } => !!entry.checkInTime)
      .sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime())
      .map(({ log, checkInTime, checkOutTime }) => ({
        staffId: log.staffId,
        name: log.staffName,
        department: log.department,
        checkInTime,
        checkOutTime,
        isLate: log.isLate === true,
        isEarly: log.isEarly === true,
      }))

    const checkedInIds = new Set(present.map((p) => p.staffId))
    const absentStaff = activeStaff.filter((staff) => !checkedInIds.has(staff.staffId))
    const currentStaff = present.filter((p) => !p.checkOutTime)
    const lateArrivals = present.filter((p) => p.isLate)
    const earlyDepartures = present
      .filter((p) => p.checkOutTime && p.isEarly)
      .map((p) => ({ ...p, checkOutTime: p.checkOutTime! }))

    return NextResponse.json({
      success: true,
      date: today,
      stats: {
        totalStaff: activeStaff.length,
        presentToday: present.length,
        currentlyPresent: currentStaff.length,
        lateToday: lateArrivals.length,
        absentToday: absentStaff.length,
        earlyDepartureToday: earlyDepartures.length,
      },
      presentToday: present,
      currentStaff,
      lateArrivals,
      earlyDepartures,
      absentStaff: absentStaff.map((staff) => ({
        staffId: staff.staffId,
        name: staff.name,
        department: staff.department,
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
