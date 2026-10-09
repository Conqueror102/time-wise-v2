/**
 * Platform reports for the owner panel, as CSV
 * GET /api/owner/reports?type=organizations|users|attendance&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"
import { toCsv } from "@/lib/utils/csv"

export const dynamic = 'force-dynamic'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  try {
    await withSuperAdminAuth(request)

    const params = request.nextUrl.searchParams
    const type = params.get("type")
    const from = params.get("from")
    const to = params.get("to")
    if ((from && !DATE.test(from)) || (to && !DATE.test(to))) {
      return NextResponse.json({ error: "Dates must be YYYY-MM-DD" }, { status: 400 })
    }

    // createdAt filter for organizations and users (inclusive of the whole "to" day, UTC)
    const createdAt: Record<string, Date> = {}
    if (from) createdAt.$gte = new Date(`${from}T00:00:00Z`)
    if (to) createdAt.$lt = new Date(new Date(`${to}T00:00:00Z`).getTime() + 86_400_000)
    const createdFilter = Object.keys(createdAt).length ? { createdAt } : {}

    const db = await getDatabase()
    const organizations = await db.collection("organizations").find({}, { projection: { name: 1, subdomain: 1, status: 1, adminEmail: 1, createdAt: 1 } }).toArray()
    const orgName = new Map(organizations.map((o) => [o._id.toString(), o.name as string]))
    const day = (d: unknown) => (d ? new Date(d as string).toISOString().slice(0, 10) : "")

    let csv: string
    if (type === "organizations") {
      const staffCounts = await db
        .collection("staff")
        .aggregate<{ _id: string; total: number; active: number }>([
          { $group: { _id: "$tenantId", total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } },
        ])
        .toArray()
      const counts = new Map(staffCounts.map((c) => [c._id, c]))
      const rows = organizations
        .filter((o) => (!createdAt.$gte || o.createdAt >= createdAt.$gte) && (!createdAt.$lt || o.createdAt < createdAt.$lt))
        .map((o) => {
          const c = counts.get(o._id.toString())
          return [o.name, o.subdomain, o.adminEmail, o.status, c?.active ?? 0, c?.total ?? 0, day(o.createdAt)]
        })
      csv = toCsv(["Name", "Subdomain", "Admin Email", "Status", "Active Staff", "Total Staff", "Created"], rows)
    } else if (type === "users") {
      const users = await db
        .collection("users")
        .find(createdFilter, { projection: { firstName: 1, lastName: 1, email: 1, role: 1, isActive: 1, tenantId: 1, createdAt: 1, lastLogin: 1 } })
        .sort({ createdAt: -1 })
        .toArray()
      const rows = users.map((u) => [
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
        u.email,
        orgName.get(u.tenantId) ?? "",
        u.role,
        u.isActive === false ? "inactive" : "active",
        day(u.createdAt),
        day(u.lastLogin),
      ])
      csv = toCsv(["Name", "Email", "Organization", "Role", "Status", "Created", "Last Login"], rows)
    } else if (type === "attendance") {
      const dateFilter: Record<string, string> = {}
      if (from) dateFilter.$gte = from
      if (to) dateFilter.$lte = to
      const summary = await db
        .collection("attendance")
        .aggregate<{ _id: { date: string; tenantId: string }; checkIns: number; late: number; early: number }>([
          { $match: Object.keys(dateFilter).length ? { date: dateFilter } : {} },
          {
            $group: {
              _id: { date: "$date", tenantId: "$tenantId" },
              checkIns: { $sum: { $cond: [{ $or: [{ $ifNull: ["$checkInTime", false] }, { $eq: ["$type", "check-in"] }] }, 1, 0] } },
              late: { $sum: { $cond: ["$isLate", 1, 0] } },
              early: { $sum: { $cond: ["$isEarly", 1, 0] } },
            },
          },
          { $sort: { "_id.date": -1 } },
        ])
        .toArray()
      const rows = summary.map((s) => [s._id.date, orgName.get(s._id.tenantId) ?? s._id.tenantId, s.checkIns, s.late, s.checkIns - s.late, s.early])
      csv = toCsv(["Date", "Organization", "Check-ins", "Late", "On Time", "Early Departures"], rows)
    } else {
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 })
    }

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Owner report error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: error.statusCode || 500 }
    )
  }
}
