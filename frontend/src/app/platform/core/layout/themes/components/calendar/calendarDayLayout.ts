import { isoToLocalDt } from './calendarDateUtils.ts';
import type { CalendarItem } from './types.ts';

export interface CalendarLayoutItem<T extends CalendarItem> {
  item: T;
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

// A timed item fully spans this day when it neither starts nor ends on it.
export function spansFullDay(item: CalendarItem, selectedDate: string): boolean {
  const startDate = isoToLocalDt(item.start_at).slice(0, 10);
  const endDate = isoToLocalDt(item.end_at).slice(0, 10);
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

// Clips an item's start/end to the boundaries of the viewed day, e.g. a
// multi-day item only shows "actual start → 24:00" on its first day.
export function clipToDay(item: CalendarItem, bounds: DayBounds): ClippedRange {
  const startMs = new Date(item.start_at).getTime();
  const endMs = new Date(item.end_at).getTime();
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

// Widens the default 8-20h window to fit every clipped item range, with a 1h margin.
export function computeRange(ranges: ClippedRange[]): HourRange {
  if (!ranges.length) return { startH: DEFAULT_START_H, endH: DEFAULT_END_H };
  return {
    startH: Math.max(0, Math.floor(Math.min(...ranges.map(r => r.startH))) - 1),
    endH: Math.min(24, Math.ceil(Math.max(...ranges.map(r => r.endH))) + 1),
  };
}

export function buildDayLayout<T extends CalendarItem>(items: T[]): CalendarLayoutItem<T>[] {
  if (!items.length) return [];

  const withTime = items.map(item => ({
    item,
    start: new Date(item.start_at).getTime(),
    end: new Date(item.end_at).getTime(),
  }));

  const sorted = [...withTime].sort((a, b) => a.start - b.start);
  const colEnds: number[] = [];

  const laidOut = sorted.map(({ item, start, end }) => {
    let col = colEnds.findIndex(colEnd => colEnd <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }
    return { item, start, end, col, totalCols: 1 };
  });

  for (const entry of laidOut) {
    let maxCol = entry.col;
    for (const other of laidOut) {
      if (other.start < entry.end && entry.start < other.end) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    entry.totalCols = maxCol + 1;
  }

  return laidOut.map(({ item, col, totalCols }) => ({ item, col, totalCols }));
}
