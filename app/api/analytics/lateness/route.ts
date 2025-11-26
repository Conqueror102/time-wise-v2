import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
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

    // Check feature access - Lateness analytics are Professional+ (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can access lateness analytics (Professional+)
      if (!hasFeatureAccess(subscription.plan as any, "analyticsLateness", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Lateness analytics are only available in Professional and Enterprise plans. Upgrade to access this feature.",
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

    // Get organization settings for expected work time
    const organization = await db.collection("organizations").findOne({
      _id: new ObjectId(context.tenantId),
    })
    const latenessTime = organization?.settings?.latenessTime || "09:00"

    // Get all attendance records in range
    const allRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
    })

    // Filter for late records (must have checkInTime and isLate === true)
    const lateRecords = allRecords.filter((r) => r.checkInTime && r.isLate === true)

    // Count total check-ins
    const totalRecords = allRecords.filter((r) => r.checkInTime).length

    // Calculate distribution by delay duration
    const distribution = [0, 0, 0, 0] // 0-15, 15-30, 30-60, 60+
    let totalDelay = 0

    lateRecords.forEach((record) => {
      // Calculate actual delay in minutes
      let delay = 0
      if (record.checkInTime && latenessTime) {
        const checkInDate = new Date(record.checkInTime)
        const [hours, minutes] = latenessTime.split(':').map(Number)
        const expectedDate = new Date(record.checkInTime)
        expectedDate.setHours(hours, minutes, 0, 0)
        
        // Calculate delay in minutes
        delay = Math.max(0, Math.round((checkInDate.getTime() - expectedDate.getTime()) / (1000 * 60)))
      }
      
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
    const previousRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: previousStartDateStr, $lt: startDateStr },
    })

    const previousLateCount = previousRecords.filter((r) => r.checkInTime && r.isLate === true).length
    const previousTotal = previousRecords.filter((r) => r.checkInTime).length

    const currentRate = totalRecords > 0 ? (lateRecords.length / totalRecords) * 100 : 0
    const previousRate = previousTotal > 0 ? (previousLateCount / previousTotal) * 100 : 0
    const trend = Math.round((currentRate - previousRate) * 10) / 10

    // Recent late arrivals for table
    const recentLate = lateRecords
      .sort((a, b) => new Date(b.checkInTime || b.timestamp).getTime() - new Date(a.checkInTime || a.timestamp).getTime())
      .slice(0, 20)
      .map((record) => {
        // Calculate actual delay
        let delay = 0
        if (record.checkInTime && latenessTime) {
          const checkInDate = new Date(record.checkInTime)
          const [hours, minutes] = latenessTime.split(':').map(Number)
          const expectedDate = new Date(record.checkInTime)
          expectedDate.setHours(hours, minutes, 0, 0)
          delay = Math.max(0, Math.round((checkInDate.getTime() - expectedDate.getTime()) / (1000 * 60)))
        }

        // Format expected time
        const [hours, minutes] = latenessTime.split(':').map(Number)
        const expectedDate = new Date()
        expectedDate.setHours(hours, minutes, 0, 0)
        const expectedTime = expectedDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })

        return {
          staffName: record.staffName || record.staffId,
          department: record.department || "N/A",
          date: record.date,
          expectedTime,
          actualTime: new Date(record.checkInTime || record.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          delay,
        }
      })

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
