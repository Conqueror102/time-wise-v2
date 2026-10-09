import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, AttendanceLog, TenantError } from "@/lib/types"
import { getAnalyticsRange, getWorkingDays, isCheckIn, percent } from "@/lib/analytics/range"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function punctuality(records: AttendanceLog[]): number | null {
  const checkIns = records.filter(isCheckIn)
  if (checkIns.length === 0) return null
  const onTime = checkIns.filter((r) => r.isLate !== true).length
  return Math.round((onTime / checkIns.length) * 100)
}

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)
    const range = await getAnalyticsRange(db, context.tenantId, request.nextUrl.searchParams.get("range"))

    const [activeStaff, records, previousRecords] = await Promise.all([
      tenantDb.find<Staff>("staff", { isActive: true }),
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.start, $lte: range.end } }),
      tenantDb.find<AttendanceLog>("attendance", { date: { $gte: range.previousStart, $lte: range.previousEnd } }),
    ])

    const workingDays = getWorkingDays(records).size

    // Group by the staff member's current department so records follow department changes
    const departmentOf = new Map(activeStaff.map((s) => [s.staffId, s.department || "Unassigned"]))
    const groupByDepartment = (list: AttendanceLog[]) => {
      const groups: Record<string, AttendanceLog[]> = {}
      for (const record of list) {
        const dept = departmentOf.get(record.staffId)
        if (dept) (groups[dept] ??= []).push(record)
      }
      return groups
    }
    const current = groupByDepartment(records)
    const previous = groupByDepartment(previousRecords)

    const staffCountByDept: Record<string, number> = {}
    for (const dept of departmentOf.values()) staffCountByDept[dept] = (staffCountByDept[dept] || 0) + 1

    const departments = Object.entries(staffCountByDept).map(([name, staffCount]) => {
      const deptRecords = current[name] || []
      const checkIns = deptRecords.filter(isCheckIn).length
      const lateCount = deptRecords.filter((r) => isCheckIn(r) && r.isLate === true).length
      const score = punctuality(deptRecords)
      const previousScore = punctuality(previous[name] || [])

      return {
        name,
        staffCount,
        attendanceRate: percent(checkIns, staffCount * workingDays),
        punctualityScore: score ?? 0,
        lateCount,
        trend: score !== null && previousScore !== null ? score - previousScore : 0,
      }
    })

    departments.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("Analytics departments error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Failed to fetch department data" }, { status: 500 })
  }
}
