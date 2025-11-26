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

    // Check feature access - Trends are Enterprise only (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can access trends analytics (Enterprise only)
      if (!hasFeatureAccess(subscription.plan as any, "analyticsTrends", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Trends analytics are only available in the Enterprise plan. Upgrade to access advanced insights.",
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
      // Count check-ins
      if (record.checkInTime) {
        dataByDate[date].checkIns++
        if (record.isLate === true) {
          dataByDate[date].late++
        } else {
          dataByDate[date].onTime++
        }
      }
      // Count check-outs
      if (record.checkOutTime) {
        dataByDate[date].checkOuts++
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
      if (recordDate >= oneWeekAgo && record.checkInTime) {
        thisWeek[dayOfWeek]++
      } else if (recordDate >= twoWeeksAgo && recordDate < oneWeekAgo && record.checkInTime) {
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
