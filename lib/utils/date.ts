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