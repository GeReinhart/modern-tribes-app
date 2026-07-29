import { isoToLocalDt } from './dateUtils.ts';
import type { CalendarEvent } from './types.ts';

export interface LayoutItem {
  event: CalendarEvent;
  col: number;
  totalCols: number;
}

export interface DayBounds {
  start: number;
  end: number;
}

export interface ClippedRange {
  startH: number;
  endH: number;
  startLabel: string;
  endLabel: string;
  startIsMidnight: boolean;
  endIsMidnight: boolean;
}

// A timed event fully spans this day when it neither starts nor ends on it.
export function spansFullDay(event: CalendarEvent, selectedDate: string): boolean {
  const startDate = isoToLocalDt(event.start_at).slice(0, 10);
  const endDate = isoToLocalDt(event.end_at).slice(0, 10);
  return startDate < selectedDate && endDate > selectedDate;
}

export function dayBoundsMs(selectedDate: string): DayBounds {
  const [y, m, d] = selectedDate.split('-').map(Number);
  return {
    start: new Date(y, m - 1, d, 0, 0, 0).getTime(),
    end: new Date(y, m - 1, d + 1, 0, 0, 0).getTime(),
  };
}

function fmtHm(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Clips an event's start/end to the boundaries of the viewed day, e.g. a
// multi-day event only shows "actual start → 24:00" on its first day.
export function clipToDay(event: CalendarEvent, bounds: DayBounds): ClippedRange {
  const startMs = new Date(event.start_at).getTime();
  const endMs = new Date(event.end_at).getTime();
  const clampedStart = Math.min(Math.max(startMs, bounds.start), bounds.end);
  const clampedEnd = Math.min(Math.max(endMs, bounds.start), bounds.end);
  const startIsMidnight = startMs < bounds.start;
  const endIsMidnight = endMs > bounds.end;
  return {
    startH: (clampedStart - bounds.start) / 3600000,
    endH: (clampedEnd - bounds.start) / 3600000,
    startLabel: startIsMidnight ? '00:00' : fmtHm(startMs),
    endLabel: endIsMidnight ? '24:00' : fmtHm(endMs),
    startIsMidnight,
    endIsMidnight,
  };
}

export const DEFAULT_START_H = 8;

export const DEFAULT_END_H = 20;

export interface HourRange {
  startH: number;
  endH: number;
}

// Widens the default 8-20h window to fit every clipped event range, with a 1h margin.
export function computeRange(ranges: ClippedRange[]): HourRange {
  if (!ranges.length) return { startH: DEFAULT_START_H, endH: DEFAULT_END_H };
  return {
    startH: Math.max(0, Math.floor(Math.min(...ranges.map(r => r.startH))) - 1),
    endH: Math.min(24, Math.ceil(Math.max(...ranges.map(r => r.endH))) + 1),
  };
}

export function buildDayLayout(events: CalendarEvent[]): LayoutItem[] {
  if (!events.length) return [];

  const withTime = events.map(ev => ({
    ev,
    start: new Date(ev.start_at).getTime(),
    end: new Date(ev.end_at).getTime(),
  }));

  const sorted = [...withTime].sort((a, b) => a.start - b.start);
  const colEnds: number[] = [];

  const items = sorted.map(({ ev, start, end }) => {
    let col = colEnds.findIndex(colEnd => colEnd <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }
    return { event: ev, start, end, col, totalCols: 1 };
  });

  for (const item of items) {
    let maxCol = item.col;
    for (const other of items) {
      if (other.start < item.end && item.start < other.end) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    item.totalCols = maxCol + 1;
  }

  return items.map(({ event, col, totalCols }) => ({ event, col, totalCols }));
}
