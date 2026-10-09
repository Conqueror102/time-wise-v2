/**
 * Fingerprint devices for the organization (org admin)
 * GET  - list devices with their connection status
 * POST - add a device { name, type: "zkteco" | "http", serialNumber? }
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/auth"
import { TenantError } from "@/lib/types"
import { createDevice, Device, listDevices, ONLINE_WINDOW_MS } from "@/lib/devices/service"

export const dynamic = 'force-dynamic'

function present(device: Device) {
  const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0
  return {
    id: device._id!.toString(),
    name: device.name,
    type: device.type,
    serialNumber: device.serialNumber,
    createdAt: device.createdAt,
    lastSeenAt: device.lastSeenAt,
    lastPunchAt: device.lastPunchAt,
    punchCount: device.punchCount,
    status: !lastSeen ? "waiting" : Date.now() - lastSeen < ONLINE_WINDOW_MS ? "online" : "offline",
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, { allowedRoles: ["org_admin", "manager"] })
    const db = await getDatabase()
    const devices = await listDevices(db, context.tenantId)
    return NextResponse.json({ devices: devices.map(present) })
  } catch (error) {
    if (error instanceof TenantError) return NextResponse.json({ error: error.message }, { status: error.statusCode })
    console.error("List devices error:", error)
    return NextResponse.json({ error: "Failed to load devices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await withAuth(request, { allowedRoles: ["org_admin"] })
    const { name, type, serialNumber } = await request.json()

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Device name is required" }, { status: 400 })
    }
    if (type !== "zkteco" && type !== "http") {
      return NextResponse.json({ error: "Unknown device type" }, { status: 400 })
    }
    const serial = typeof serialNumber === "string" ? serialNumber.trim().toUpperCase() : ""
    if (type === "zkteco" && !/^[A-Z0-9-]{4,40}$/.test(serial)) {
      return NextResponse.json({ error: "Enter the device's serial number (shown under System Info on the device)" }, { status: 400 })
    }

    const db = await getDatabase()
    try {
      const { device, secret } = await createDevice(db, context.tenantId, {
        name: name.trim().slice(0, 60),
        type,
        serialNumber: serial || undefined,
      })
      return NextResponse.json({ device: present(device), token: secret })
    } catch (error: any) {
      if (error?.code === 11000) {
        return NextResponse.json({ error: "A device with this serial number is already registered" }, { status: 409 })
      }
      throw error
    }
  } catch (error) {
    if (error instanceof TenantError) return NextResponse.json({ error: error.message }, { status: error.statusCode })
    console.error("Create device error:", error)
    return NextResponse.json({ error: "Failed to add device" }, { status: 500 })
  }
}
