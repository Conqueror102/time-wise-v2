/**
 * Get current attendance status for a staff member (kiosk)
 */

import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { AttendanceLog, TenantError } from "@/lib/types"
import { verifyKioskRequest } from "@/lib/auth/checkin-tokens"
import { getOrganizationToday } from "@/lib/checkin/policy"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = verifyKioskRequest(request)
    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, tenantId)
    const currentDate = await getOrganizationToday(db, tenantId)

    const todayRecord = await tenantDb.findOne<AttendanceLog>("attendance", {
      staffId: String(staffId).trim().toUpperCase(),
      date: currentDate,
    })

    const status = {
      hasCheckedIn: !!todayRecord?.checkInTime,
      hasCheckedOut: !!todayRecord?.checkOutTime,
      checkInTime: todayRecord?.checkInTime,
      checkOutTime: todayRecord?.checkOutTime,
      isLate: todayRecord?.isLate || false,
      isEarly: todayRecord?.isEarly || false,
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message, success: false }, { status: error.statusCode })
    }
    console.error("Status check error:", error)
    return NextResponse.json({
      error: "Failed to check attendance status",
      success: false
    }, { status: 500 })
  }
}
