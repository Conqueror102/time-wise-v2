/**
 * Attendance History API - Get attendance records by date
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, TenantError } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const staffId = searchParams.get("staffId")

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Build query for check-ins
    const checkInQuery: any = { type: "check-in" }
    
    if (date) {
      // Single date query
      checkInQuery.date = date
    } else if (startDate && endDate) {
      // Date range query
      checkInQuery.date = { $gte: startDate, $lte: endDate }
    } else {
      // Default to today
      checkInQuery.date = new Date().toISOString().split("T")[0]
    }

    if (staffId) {
      checkInQuery.staffId = staffId
    }

    // Get check-ins
    const checkIns = await tenantDb.find<AttendanceLog>("attendance", checkInQuery)

    // Build query for check-outs
    const checkOutQuery: any = { type: "check-out" }
    if (date) {
      checkOutQuery.date = date
    } else if (startDate && endDate) {
      checkOutQuery.date = { $gte: startDate, $lte: endDate }
    } else {
      checkOutQuery.date = new Date().toISOString().split("T")[0]
    }

    if (staffId) {
      checkOutQuery.staffId = staffId
    }

    const checkOuts = await tenantDb.find<AttendanceLog>("attendance", checkOutQuery)

    // Create a map of check-outs by staffId and date
    const checkOutMap = new Map<string, string>()
    checkOuts.forEach((log) => {
      const key = `${log.staffId}-${log.date}`
      checkOutMap.set(key, log.timestamp)
    })

    // Create a map for early departures
    const earlyDepartureMap = new Map<string, boolean>()
    checkOuts.forEach((log) => {
      const key = `${log.staffId}-${log.date}`
      if (log.isEarly) {
        earlyDepartureMap.set(key, true)
      }
    })

    // Combine check-in and check-out data
    const attendance = checkIns.map((log) => ({
      staffId: log.staffId,
      staffName: log.staffName,
      department: log.department,
      checkInTime: log.timestamp,
      checkOutTime: checkOutMap.get(`${log.staffId}-${log.date}`),
      isLate: log.isLate,
      isEarly: earlyDepartureMap.get(`${log.staffId}-${log.date}`) || false,
      date: log.date,
    }))

    // Sort by date descending
    attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      success: true,
      attendance,
      filters: {
        date,
        startDate,
        endDate,
        staffId,
      },
    })
  } catch (error) {
    console.error("Attendance history error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    )
  }
}
