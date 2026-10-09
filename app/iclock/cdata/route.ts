/**
 * ZKTeco ADMS endpoint: handshake (GET) and attendance upload (POST).
 * See lib/devices/zkteco.ts.
 */

import { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { markDeviceSeen, recordDevicePunch } from "@/lib/devices/service"
import { deviceFromRequest, parseAttendanceLog, text, verifyMethod } from "@/lib/devices/zkteco"
import { getOrganizationTimezone } from "@/lib/checkin/policy"
import { zonedTimeToUtc } from "@/lib/utils/date"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const db = await getDatabase()
  const device = await deviceFromRequest(db, request)
  if (!device) return text("Unknown device. Register its serial number in TimeWise Settings.", 403)

  await markDeviceSeen(db, device)
  const serial = device.serialNumber
  // Ask for attendance logs only, sent in real time
  return text(
    [
      `GET OPTION FROM: ${serial}`,
      "ATTLOGStamp=None",
      "OPERLOGStamp=9999",
      "ATTPHOTOStamp=None",
      "ErrorDelay=30",
      "Delay=10",
      "TransTimes=00:00;14:05",
      "TransInterval=1",
      "TransFlag=TransData AttLog",
      "Realtime=1",
      "Encrypt=None",
    ].join("\n")
  )
}

export async function POST(request: NextRequest) {
  const db = await getDatabase()
  const device = await deviceFromRequest(db, request)
  if (!device) return text("Unknown device", 403)

  await markDeviceSeen(db, device)
  const body = await request.text()

  // Other tables (operation log, photos, templates) are acknowledged and ignored
  if (request.nextUrl.searchParams.get("table") !== "ATTLOG") {
    return text("OK")
  }

  const rows = parseAttendanceLog(body)
  const timezone = await getOrganizationTimezone(db, device.tenantId)
  for (const row of rows) {
    await recordDevicePunch(db, device, {
      pin: row.pin,
      time: zonedTimeToUtc(row.date, row.time, timezone),
      method: verifyMethod(row.verify),
    })
  }
  return text(`OK: ${rows.length}`)
}
