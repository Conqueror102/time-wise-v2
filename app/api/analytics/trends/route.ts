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

    // Get attendance records
    const records = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
    })

    // Group by date
    const dataByDate: Record<string, any> = {}
    records.forEach((record) => {
      const date = record.date
      if (!dataByDate[date]) {
        dataByDate[date] = {
          checkIns: 0,
          checkOuts: 0,
          onTime: 0,
          late: 0,
          absent: 0,
        }
      }
      if (record.type === "check-in") dataByDate[date].checkIns++
      if (record.type === "check-out") dataByDate[date].checkOuts++
      if (record.type === "check-in") {
        if (record.isLate) {
          dataByDate[date].late++
        } else {
          dataByDate[date].onTime++
        }
      }
    })

    // Generate labels and data arrays
    const labels: string[] = []
    const checkIns: number[] = []
    const checkOuts: number[] = []
    const onTime: number[] = []
    const late: number[] = []
    const absent: number[] = []

    // Fill in all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

      labels.push(label)
      const dayData = dataByDate[dateStr] || { checkIns: 0, checkOuts: 0, onTime: 0, late: 0, absent: 0 }
      checkIns.push(dayData.checkIns)
      checkOuts.push(dayData.checkOuts)
      onTime.push(dayData.onTime)
      late.push(dayData.late)
      absent.push(dayData.absent)
    }

    // Weekly comparison data
    const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const thisWeek = new Array(7).fill(0)
    const lastWeek = new Array(7).fill(0)

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    records.forEach((record) => {
      const recordDate = new Date(record.date)
      const dayOfWeek = recordDate.getDay()
      if (recordDate >= oneWeekAgo && record.type === "check-in") {
        thisWeek[dayOfWeek]++
      } else if (recordDate >= twoWeeksAgo && recordDate < oneWeekAgo && record.type === "check-in") {
        lastWeek[dayOfWeek]++
      }
    })

    return NextResponse.json({
      labels,
      checkIns,
      checkOuts,
      onTime,
      late,
      absent,
      weeklyLabels,
      thisWeek,
      lastWeek,
    })
  } catch (error) {
    console.error("Analytics trends error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 })
  }
}
