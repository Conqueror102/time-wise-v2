import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { AttendanceLog, TenantError } from "@/lib/types"

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

    // Get late attendance records
    const lateRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
      type: "check-in",
      isLate: true,
    })

    const totalRecords = await tenantDb.count<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
      type: "check-in",
    })

    // Calculate distribution by delay duration
    const distribution = [0, 0, 0, 0] // 0-15, 15-30, 30-60, 60+
    let totalDelay = 0

    lateRecords.forEach((record) => {
      // Calculate delay in minutes (simplified - you may need to adjust based on your shift times)
      const delay = 30 // Placeholder - calculate actual delay based on expected time
      totalDelay += delay

      if (delay <= 15) distribution[0]++
      else if (delay <= 30) distribution[1]++
      else if (delay <= 60) distribution[2]++
      else distribution[3]++
    })

    // Get top late staff
    const staffLateCount: Record<string, { name: string; count: number }> = {}
    lateRecords.forEach((record) => {
      const staffId = record.staffId
      if (!staffLateCount[staffId]) {
        staffLateCount[staffId] = {
          name: record.staffName || staffId,
          count: 0,
        }
      }
      staffLateCount[staffId].count++
    })

    const topLateStaff = Object.values(staffLateCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate trend
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDateStr = previousStartDate.toISOString().split("T")[0]
    const previousLateCount = await tenantDb.count<AttendanceLog>("attendance", {
      date: { $gte: previousStartDateStr, $lt: startDateStr },
      type: "check-in",
      isLate: true,
    })

    const previousTotal = await tenantDb.count<AttendanceLog>("attendance", {
      date: { $gte: previousStartDateStr, $lt: startDateStr },
      type: "check-in",
    })

    const currentRate = totalRecords > 0 ? (lateRecords.length / totalRecords) * 100 : 0
    const previousRate = previousTotal > 0 ? (previousLateCount / previousTotal) * 100 : 0
    const trend = Math.round((currentRate - previousRate) * 10) / 10

    // Recent late arrivals for table
    const recentLate = lateRecords.slice(0, 20).map((record) => ({
      staffName: record.staffName || record.staffId,
      department: record.department || "N/A",
      date: record.date,
      expectedTime: "09:00 AM", // Placeholder - get from shift settings
      actualTime: new Date(record.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      delay: 30, // Placeholder - calculate actual delay
    }))

    return NextResponse.json({
      totalLate: lateRecords.length,
      latePercentage: Math.round(currentRate * 10) / 10,
      averageDelay: lateRecords.length > 0 ? Math.round(totalDelay / lateRecords.length) : 0,
      trend,
      distribution,
      topLateStaff,
      recentLate,
    })
  } catch (error) {
    console.error("Analytics lateness error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch lateness data" }, { status: 500 })
  }
}
