/**
 * ZKTeco ADMS ("cloud server" / push) protocol helpers.
 *
 * The device is configured with this server's address. It then:
 *   GET  /iclock/cdata?SN=<serial>&options=all   handshake, receives options
 *   POST /iclock/cdata?SN=<serial>&table=ATTLOG   uploads punches, one per line:
 *        PIN \t YYYY-MM-DD HH:MM:SS \t status \t verify \t workcode ...
 *   GET  /iclock/getrequest?SN=<serial>          polls for commands ("OK" = none)
 *
 * Times are the device's local clock, read in the organization's timezone.
 */

import { NextRequest, NextResponse } from "next/server"
import { Db } from "mongodb"
import { Device, findDeviceBySerial } from "@/lib/devices/service"

export function text(body: string, status = 200) {
  return new NextResponse(body, { status, headers: { "Content-Type": "text/plain" } })
}

export async function deviceFromRequest(db: Db, request: NextRequest): Promise<Device | null> {
  const serial = request.nextUrl.searchParams.get("SN")?.trim().toUpperCase()
  return serial ? findDeviceBySerial(db, serial) : null
}

/** Verify-type codes reported by ZKTeco devices */
export function verifyMethod(code: string | undefined): string {
  switch (Number(code)) {
    case 1:
      return "fingerprint"
    case 15:
      return "face"
    case 2:
    case 4:
      return "card"
    case 0:
      return "pin"
    default:
      return "fingerprint"
  }
}

export interface AttendanceLogRow {
  pin: string
  date: string
  time: string
  verify?: string
}

export function parseAttendanceLog(body: string): AttendanceLogRow[] {
  const rows: AttendanceLogRow[] = []
  for (const line of body.split(/\r?\n/)) {
    const [pin, datetime, , verify] = line.split("\t")
    const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec((datetime || "").trim())
    if (match && pin?.trim()) rows.push({ pin: pin.trim(), date: match[1], time: match[2], verify })
  }
  return rows
}
