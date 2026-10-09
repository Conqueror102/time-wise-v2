/**
 * ZKTeco ADMS command results. Acknowledged so the device does not retry.
 */

import { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { deviceFromRequest, text } from "@/lib/devices/zkteco"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const db = await getDatabase()
  if (!(await deviceFromRequest(db, request))) return text("Unknown device", 403)
  return text("OK")
}
