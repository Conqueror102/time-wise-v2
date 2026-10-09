/**
 * Utility functions for consistent UTC date handling
 */

export function getUTCDate(date: Date = new Date()): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ))
}

export function getUTCDateOnly(date: Date = new Date()): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0
  ))
}

export function addDaysUTC(date: Date, days: number): Date {
  const newDate = new Date(date)
  newDate.setUTCDate(newDate.getUTCDate() + days)
  return newDate
}

export function subtractDaysUTC(date: Date, days: number): Date {
  return addDaysUTC(date, -days)
}

export function getUTCDateString(date: Date = new Date()): string {
  return getUTCDate(date).toISOString().split('T')[0]
}

export function getLocalTimeString(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function getLocalDateString(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "UTC"

export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || !timeZone) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
    return true
  } catch {
    return false
  }
}

/**
 * Wall-clock date ("YYYY-MM-DD") and time ("HH:MM") of an instant in a timezone.
 * Used so lateness and "today" follow the organization's local time rather
 * than the server's clock (UTC on Vercel).
 */
export function getZonedDateTime(date: Date, timeZone: string): { date: string; time: string } {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/** Add days to a "YYYY-MM-DD" date string */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * Convert a wall-clock date and time in a timezone to a real instant.
 * e.g. ("2026-10-09", "08:52:11", "Africa/Lagos") -> 2026-10-09T07:52:11Z
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, mi, s = 0] = time.split(":").map(Number)
  const wallClockAsUtc = Date.UTC(y, mo - 1, d, h, mi, s)
  // Find the zone's offset at that moment (two passes handle DST transitions)
  let guess = wallClockAsUtc
  for (let i = 0; i < 2; i++) {
    const parts = getZonedDateTime(new Date(guess), timeZone)
    const [gy, gmo, gd] = parts.date.split("-").map(Number)
    const [gh, gmi] = parts.time.split(":").map(Number)
    const shownAsUtc = Date.UTC(gy, gmo - 1, gd, gh, gmi, new Date(guess).getUTCSeconds())
    guess += wallClockAsUtc - shownAsUtc
  }
  return new Date(guess)
}
