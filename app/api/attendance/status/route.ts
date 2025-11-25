/**
 * Get current attendance status for a staff member
 */

import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { AttendanceLog } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tenantId } = await request.json()

    if (!staffId || !tenantId) {
      return NextResponse.json({ error: "Staff ID and tenant ID are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, tenantId)
    
    const currentDate = new Date().toISOString().split("T")[0]

    // Ensure index exists for faster queries (runs once, then cached)
    try {
      await tenantDb.collection("attendance").createIndex(
        { staffId: 1, date: -1 },
        { background: true }
      )
    } catch (e) {
      // Index might already exist, ignore error
    }

    // Get today's attendance record
    const todayRecord = await tenantDb.findOne<AttendanceLog>("attendance", {
      staffId,
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
    console.error("Status check error:", error)
    return NextResponse.json({ 
      error: "Failed to check attendance status",
      success: false 
    }, { status: 500 })
  }
}