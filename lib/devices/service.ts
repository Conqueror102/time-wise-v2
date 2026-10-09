/**
 * Fingerprint attendance devices (time clocks).
 *
 * Fingerprints are enrolled and matched on the device itself; the device then
 * reports "PIN x punched at time t". Each staff member's device PIN is the
 * number in their staff ID (STAFF337724 -> 337724).
 *
 * Two kinds of device are supported:
 * - "zkteco": devices using ZKTeco's ADMS / "cloud server" push protocol,
 *   identified by serial number (see app/iclock/*)
 * - "http": anything that can POST JSON to /api/devices/punch with a token
 */

import crypto from "crypto"
import { Db, ObjectId } from "mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { getCheckInPolicy } from "@/lib/checkin/policy"
import { getZonedDateTime } from "@/lib/utils/date"
import { AttendanceLog, Staff } from "@/lib/types"

export type DeviceType = "zkteco" | "http"

export interface Device {
  _id?: ObjectId
  tenantId: string
  name: string
  type: DeviceType
  /** ZKTeco serial number (SN) */
  serialNumber?: string
  /** sha256 of the HTTP device secret */
  secretHash?: string
  createdAt: Date
  lastSeenAt?: Date
  lastPunchAt?: Date
  punchCount: number
}

const DEVICES = "devices"
const PUNCHES = "device_punches"
// A second punch this soon after the previous one is treated as an accidental double tap
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000
// ZKTeco devices poll every ~30s; after this long without contact we call it offline
export const ONLINE_WINDOW_MS = 5 * 60 * 1000

let indexesReady: Promise<unknown> | null = null
function ensureIndexes(db: Db) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection(DEVICES).createIndex({ serialNumber: 1 }, { unique: true, sparse: true }),
      db.collection(DEVICES).createIndex({ tenantId: 1 }),
      // Devices re-send logs after reconnecting; the same punch must only count once
      db.collection(PUNCHES).createIndex({ deviceId: 1, pin: 1, time: 1 }, { unique: true }),
    ]).catch((error) => {
      indexesReady = null
      console.error("Failed to create device indexes:", error)
    })
  }
  return indexesReady
}

const hashSecret = (secret: string) => crypto.createHash("sha256").update(secret).digest("hex")

export { staffPin } from "./pin"

export async function createDevice(
  db: Db,
  tenantId: string,
  input: { name: string; type: DeviceType; serialNumber?: string }
): Promise<{ device: Device; secret?: string }> {
  await ensureIndexes(db)
  const device: Device = {
    tenantId,
    name: input.name,
    type: input.type,
    createdAt: new Date(),
    punchCount: 0,
  }
  let secret: string | undefined
  if (input.type === "zkteco") {
    device.serialNumber = input.serialNumber
  } else {
    secret = crypto.randomBytes(24).toString("base64url")
    device.secretHash = hashSecret(secret)
  }
  const { insertedId } = await db.collection<Device>(DEVICES).insertOne(device)
  device._id = insertedId
  // The token the device sends is "<deviceId>.<secret>"; the secret is shown once
  return { device, secret: secret && `${insertedId.toString()}.${secret}` }
}

export async function listDevices(db: Db, tenantId: string): Promise<Device[]> {
  return db.collection<Device>(DEVICES).find({ tenantId }).sort({ createdAt: 1 }).toArray()
}

export async function deleteDevice(db: Db, tenantId: string, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false
  const result = await db.collection<Device>(DEVICES).deleteOne({ _id: new ObjectId(id), tenantId })
  return result.deletedCount > 0
}

export async function findDeviceBySerial(db: Db, serialNumber: string): Promise<Device | null> {
  return db.collection<Device>(DEVICES).findOne({ type: "zkteco", serialNumber })
}

/** Authenticate an HTTP device from its "<deviceId>.<secret>" token */
export async function findDeviceByToken(db: Db, token: string): Promise<Device | null> {
  const [id, secret] = token.split(".")
  if (!id || !secret || !ObjectId.isValid(id)) return null
  const device = await db.collection<Device>(DEVICES).findOne({ _id: new ObjectId(id), type: "http" })
  if (!device?.secretHash) return null
  const a = Buffer.from(device.secretHash, "hex")
  const b = Buffer.from(hashSecret(secret), "hex")
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? device : null
}

export async function markDeviceSeen(db: Db, device: Device): Promise<void> {
  await db.collection<Device>(DEVICES).updateOne({ _id: device._id }, { $set: { lastSeenAt: new Date() } })
}

export type PunchResult =
  | { result: "checked-in" | "checked-out"; staffId: string; staffName: string; isLate?: boolean; isEarly?: boolean }
  | { result: "duplicate" | "unknown-staff" | "inactive-staff"; staffId?: string; staffName?: string }

/**
 * Record one punch from a device. The first punch of the day checks the person
 * in; a later punch checks them out (and a later one still moves the check-out
 * time forward, so the last punch of the day counts).
 */
export async function recordDevicePunch(
  db: Db,
  device: Device,
  punch: { pin: string; time: Date; method: string }
): Promise<PunchResult> {
  await ensureIndexes(db)
  const pin = punch.pin.replace(/\D/g, "").replace(/^0+(?=\d)/, "")
  if (!pin) return { result: "unknown-staff" }

  try {
    await db.collection(PUNCHES).insertOne({
      deviceId: device._id!.toString(),
      tenantId: device.tenantId,
      pin,
      time: punch.time,
      method: punch.method,
      receivedAt: new Date(),
    })
  } catch (error: any) {
    if (error?.code === 11000) return { result: "duplicate" }
    throw error
  }

  await db.collection<Device>(DEVICES).updateOne(
    { _id: device._id },
    { $set: { lastSeenAt: new Date(), lastPunchAt: new Date() }, $inc: { punchCount: 1 } }
  )

  const tenantDb = createTenantDatabase(db, device.tenantId)
  const staff = await tenantDb.findOne<Staff>("staff", { staffId: { $regex: `^STAFF0*${pin}$` } })
  if (!staff) return { result: "unknown-staff" }
  if (!staff.isActive) return { result: "inactive-staff", staffId: staff.staffId, staffName: staff.name }

  const organization = await db.collection("organizations").findOne({ _id: new ObjectId(device.tenantId) })
  const policy = getCheckInPolicy(organization || {})
  const { date, time } = getZonedDateTime(punch.time, policy.timezone)

  const record = await tenantDb.findOne<AttendanceLog>("attendance", { staffId: staff.staffId, date })

  if (!record || !record.checkInTime) {
    const isLate = time > policy.latenessTime
    await tenantDb.insertOne<AttendanceLog>("attendance", {
      staffId: staff.staffId,
      staffName: staff.name,
      department: staff.department,
      type: "check-in",
      status: isLate ? "late" : "present",
      method: punch.method,
      checkInMethod: punch.method,
      checkInTime: punch.time,
      timestamp: punch.time,
      date,
      isLate,
    } as any)
    return { result: "checked-in", staffId: staff.staffId, staffName: staff.name, isLate }
  }

  const lastPunch = new Date(record.checkOutTime || record.checkInTime).getTime()
  if (punch.time.getTime() - lastPunch < DUPLICATE_WINDOW_MS) {
    return { result: "duplicate", staffId: staff.staffId, staffName: staff.name }
  }

  const isEarly = time < policy.earlyDepartureTime
  await tenantDb.updateOne<AttendanceLog>(
    "attendance",
    { staffId: staff.staffId, date },
    {
      $set: {
        type: "check-out",
        status: record.isLate ? "late" : isEarly ? "early" : "present",
        checkOutTime: punch.time,
        checkOutMethod: punch.method,
        isEarly,
      } as any,
    }
  )
  return { result: "checked-out", staffId: staff.staffId, staffName: staff.name, isEarly }
}
