/**
 * Shared date-range and attendance helpers for the analytics APIs.
 *
 * All dates are "YYYY-MM-DD" strings in the organization's timezone, which is
 * how attendance records store their `date` field. Ranges end today and are
 * inclusive, so "7d" means today and the six days before it.
 */

import { Db } from "mongodb"
import { getOrganizationTimezone } from "@/lib/checkin/policy"
import { addDays, getZonedDateTime } from "@/lib/utils/date"
import { AttendanceLog } from "@/lib/types"

export { addDays }

export const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
}

export interface AnalyticsRange {
  timezone: string
  days: number
  /** First day of the range (inclusive) */
  start: string
  /** Last day of the range (today, inclusive) */
  end: string
  /** The same-length period immediately before this one */
  previousStart: string
  previousEnd: string
  /** Every date in the range, oldest first */
  dates: string[]
}

export async function getAnalyticsRange(db: Db, tenantId: string, rangeParam: string | null): Promise<AnalyticsRange> {
  const timezone = await getOrganizationTimezone(db, tenantId)
  const days = RANGE_DAYS[rangeParam || ""] ?? 30
  const end = getZonedDateTime(new Date(), timezone).date
  const start = addDays(end, -(days - 1))
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i))
  return {
    timezone,
    days,
    start,
    end,
    previousStart: addDays(start, -days),
    previousEnd: addDays(start, -1),
    dates,
  }
}

/** Check-in time of a record; older records only have `timestamp` */
export function getCheckInTime(record: AttendanceLog): Date | undefined {
  if (record.checkInTime) return new Date(record.checkInTime)
  if (record.type === "check-in" && record.timestamp) return new Date(record.timestamp)
  return undefined
}

export function getCheckOutTime(record: AttendanceLog): Date | undefined {
  if (record.checkOutTime) return new Date(record.checkOutTime)
  if (record.type === "check-out" && !record.checkInTime && record.timestamp) return new Date(record.timestamp)
  return undefined
}

export function isCheckIn(record: AttendanceLog): boolean {
  return getCheckInTime(record) !== undefined
}

/**
 * Days on which the organization was open, taken as days with at least one
 * check-in. Used as the denominator for attendance rates so weekends and
 * holidays do not count as absences.
 */
export function getWorkingDays(records: AttendanceLog[]): Set<string> {
  return new Set(records.filter(isCheckIn).map((r) => r.date))
}

/** Local "YYYY-MM-DD" on which a staff member was added */
export function getJoinDate(createdAt: Date | string | undefined, timezone: string): string | undefined {
  return createdAt ? getZonedDateTime(new Date(createdAt), timezone).date : undefined
}

/** Minutes after `threshold` ("HH:MM") that `time` falls, in the organization's timezone */
export function minutesAfter(time: Date, threshold: string, timezone: string): number {
  const [h, m] = getZonedDateTime(time, timezone).time.split(":").map(Number)
  const [th, tm] = threshold.split(":").map(Number)
  return h * 60 + m - (th * 60 + tm)
}

export function formatLocalTime(time: Date, timezone: string): string {
  return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: timezone })
}

export function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.min(100, Math.round((numerator / denominator) * 100)) : 0
}
