import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    // Check feature access - Export is Professional+ (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
      const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
      
      const subscription = await getSubscriptionStatus(context.tenantId)
      
      // Check if can export data (Professional+)
      if (!hasFeatureAccess(subscription.plan as any, "exportData", subscription.isTrialActive, isDevelopment)) {
        return NextResponse.json(
          { 
            error: "Data export is only available in Professional and Enterprise plans. Upgrade to export your data.",
            code: "FEATURE_LOCKED"
          },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"
    const format = searchParams.get("format") || "csv"

    // Calculate date range
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
    const attendanceRecords = await tenantDb.find<AttendanceLog>("attendance", {
      date: { $gte: startDateStr },
    })

    // Get staff details
    const staff = await tenantDb.find<Staff>("staff", {})
    const staffMap = new Map(staff.map(s => [s.staffId, s]))

    // Prepare export data
    const exportData = attendanceRecords.map(record => ({
      Date: record.date,
      "Staff ID": record.staffId,
      "Staff Name": staffMap.get(record.staffId)?.name || "Unknown",
      Department: staffMap.get(record.staffId)?.department || "N/A",
      "Check In": record.checkInTime || "N/A",
      "Check Out": record.checkOutTime || "N/A",
      Status: record.isLate ? "Late" : record.isEarly ? "Early" : "On Time",
    }))

    if (exportData.length === 0) {
      return new NextResponse("No data available for the selected date range", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    if (format === "csv") {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {})
      const escapeCsvValue = (value: string) => {
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return `"${value}"`
      }
      const csvRows = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            return escapeCsvValue(String(value))
          }).join(",")
        )
      ]
      const csvContent = csvRows.join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-${range}.csv"`,
        },
      })
    }

    // For other formats, return JSON for now
    return NextResponse.json(exportData)

  } catch (error) {
    console.error("Export error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
