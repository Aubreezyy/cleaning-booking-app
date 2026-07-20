import {
  getBusinessHours,
  isDateBlocked,
  getBookingsForDate,
} from "./google-sheets";

export type Slot = { start: string; end: string };

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

/**
 * Returns open slots for a given date + service duration.
 * Slots are generated in 30-minute increments within business hours,
 * and a slot is only offered if fewer than max_concurrent_jobs bookings
 * already overlap that window (so multiple cleaning teams can be booked
 * in parallel).
 */
export async function getAvailableSlots(
  dateStr: string,
  durationMinutes: number
): Promise<Slot[]> {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = date.getDay();

  const hours = await getBusinessHours(weekday);
  if (!hours || hours.length === 0) return [];

  const blocked = await isDateBlocked(dateStr);
  if (blocked) return [];

  const existing = await getBookingsForDate(dateStr);
  const existingRanges = existing
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    }));

  const slots: Slot[] = [];

  for (const window of hours) {
    const windowStart = timeToMinutes(window.start_time);
    const windowEnd = timeToMinutes(window.end_time);
    const maxJobs = window.max_concurrent_jobs || 1;

    for (
      let start = windowStart;
      start + durationMinutes <= windowEnd;
      start += 30
    ) {
      const end = start + durationMinutes;
      const overlapCount = existingRanges.filter(
        (r) => start < r.end && end > r.start
      ).length;

      if (overlapCount < maxJobs) {
        slots.push({ start: minutesToTime(start), end: minutesToTime(end) });
      }
    }
  }

  // Don't offer slots in the past for today
  const now = new Date();
  const isToday = now.toISOString().slice(0, 10) === dateStr;
  if (isToday) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((s) => timeToMinutes(s.start) > nowMinutes + 60); // 1hr lead time
  }

  return slots;
}
