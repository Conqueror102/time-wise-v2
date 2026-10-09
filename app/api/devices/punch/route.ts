/**
 * Punch endpoint for HTTP fingerprint devices.
 *
 * POST /api/devices/punch
 *   Authorization: Bearer <device token from Settings>
 *   { "pin": "337724", "time": "2026-10-09T08:52:11+01:00", "method": "fingerprint" }
 *
 * `time` is optional (defaults to now). A time without a timezone, such as
 * "2026-10-09 08:52:11", is read in the organization's timezone.
 */

import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { findDeviceByToken, recordDevicePunch } from "@/lib/devices/service"
import { getOrganizationTimezone } from "@/lib/checkin/policy"
import { zonedTimeToUtc } from "@/lib/utils/date"

export const dynamic = 'force-dynamic'

const METHODS = ["fingerprint", "face", "card", "pin"]

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  const db = await getDatabase()
  const device = token ? await findDeviceByToken(db, token) : null
  if (!device) {
    return NextResponse.json({ error: "Unknown device or invalid token" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const pin = String(body.pin ?? "").trim()
  if (!/^\d{1,12}$/.test(pin)) {
    return NextResponse.json({ error: "pin must be the staff member's numeric device PIN" }, { status: 400 })
  }

  let time = new Date()
  if (body.time) {
    const local = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(String(body.time))
    time = local
      ? zonedTimeToUtc(local[1], local[2], await getOrganizationTimezone(db, device.tenantId))
      : new Date(body.time)
    if (isNaN(time.getTime())) {
      return NextResponse.json({ error: "time must be ISO 8601 or 'YYYY-MM-DD HH:mm:ss'" }, { status: 400 })
    }
  }

  const method = METHODS.includes(body.method) ? body.method : "fingerprint"
  const result = await recordDevicePunch(db, device, { pin, time, method })
  const status = result.result === "unknown-staff" ? 404 : result.result === "inactive-staff" ? 403 : 200
  return NextResponse.json(result, { status })
}

// Lets a device (or an admin with curl) confirm its token works
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  const db = await getDatabase()
  const device = token ? await findDeviceByToken(db, token) : null
  if (!device) return NextResponse.json({ error: "Unknown device or invalid token" }, { status: 401 })
  await db.collection("devices").updateOne({ _id: new ObjectId(device._id) }, { $set: { lastSeenAt: new Date() } })
  return NextResponse.json({ ok: true, device: device.name })
}
