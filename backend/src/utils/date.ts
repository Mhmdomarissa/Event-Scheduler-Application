/**
 * Date utility helpers used throughout the application.
 */

/**
 * Returns true if the two time intervals [aStart, aEnd] and [bStart, bEnd] overlap.
 * Uses the standard overlap test: aStart < bEnd && bStart < aEnd
 */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Converts a value to a UTC Date object. Throws if invalid.
 */
export function toDate(value: string | Date): Date {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

/**
 * Returns the event lifecycle status based on current time.
 */
export function eventLifecycle(startAt: Date, endAt: Date): 'upcoming' | 'ongoing' | 'past' {
  const now = new Date();
  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'past';
  return 'ongoing';
}

/**
 * Given a duration in minutes and an arbitrary start, produce an end Date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Format a Date as ISO-8601 string (UTC).
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
