/**
 * Date utilities for handling timezone-aware operations
 * All functions work with the user's local timezone
 */

/**
 * Get today's date in the user's local timezone, normalized to midnight
 */
export function getLocalToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Get a date string in YYYY-MM-DD format in the user's local timezone
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse a YYYY-MM-DD date string as a local date (not UTC)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Normalize a date to midnight in the user's local timezone
 */
export function normalizeToLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Convert a local date to UTC for API transmission
 * This ensures the date represents the same calendar date in UTC
 */
export function localDateToUTC(localDate: Date): Date {
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(), 
    localDate.getDate()
  ))
}

/**
 * Convert a UTC date to local date for display
 * This ensures we get the correct calendar date in the user's timezone
 */
export function utcDateToLocal(utcDate: Date): Date {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate()
  )
}

/**
 * Check if two dates represent the same calendar day in local timezone
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Get the start and end of a month in local timezone
 */
export function getLocalMonthRange(date: Date): { start: Date, end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}
