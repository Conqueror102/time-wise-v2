/**
 * ZKTeco ADMS command poll. TimeWise sends no commands; replying "OK" keeps the
 * device connected and marks it as online.
 */

import { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { markDeviceSeen } from "@/lib/devices/service"
import { deviceFromRequest, text } from "@/lib/devices/zkteco"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const db = await getDatabase()
  const device = await deviceFromRequest(db, request)
  if (!device) return text("Unknown device", 403)
  await markDeviceSeen(db, device)
  return text("OK")
}
