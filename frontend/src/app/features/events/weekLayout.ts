import type { CalendarEvent } from './types.ts';

export interface BarInfo {
  eventId: string;
  color: string;
  lane: number;
  startDate: string;
  endDate: string;
}

// Formats a local Date's own year/month/day, never round-tripping through
// UTC (Date#toISOString would shift the date backward by a day in any
// timezone ahead of UTC, since local midnight is still "yesterday" in UTC).
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Returns the 7 ISO dates (Monday first) of the week containing selectedDate.
export function getWeekDates(selectedDate: string): string[] {
  const [y, m, d] = selectedDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    return isoDate(day);
  });
}

// Assigns each multi-day event a lane so overlapping bars stack instead of
// colliding, the way a month/week banner displays them. Shared by
// CalendarMonth and the week view's all-day banner.
export function computeMultiDayBars(events: CalendarEvent[]): BarInfo[] {
  const multi = events.filter(e => e.start_at.slice(0, 10) !== e.end_at.slice(0, 10));
  const sorted = [...multi].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const bars: BarInfo[] = [];
  const laneEnds: string[] = [];
  for (const ev of sorted) {
    const startDate = ev.start_at.slice(0, 10);
    const endDate = ev.end_at.slice(0, 10);
    let lane = laneEnds.findIndex(end => end < startDate);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endDate;
    bars.push({ eventId: ev.id, color: ev.color, lane, startDate, endDate });
  }
  return bars;
}
