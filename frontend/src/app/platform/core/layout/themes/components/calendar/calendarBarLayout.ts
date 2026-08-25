import { DEFAULT_CALENDAR_ITEM_COLOR } from './types.ts';
import type { CalendarItem } from './types.ts';

export interface CalendarBarInfo {
  itemId: string;
  color: string;
  lane: number;
  startDate: string;
  endDate: string;
}

// Assigns each multi-day item a lane so overlapping bars stack instead of
// colliding, the way a month grid or a week's all-day banner displays them.
export function computeMultiDayBars<T extends CalendarItem>(items: T[]): CalendarBarInfo[] {
  const multi = items.filter(i => i.start_at.slice(0, 10) !== i.end_at.slice(0, 10));
  const sorted = [...multi].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const bars: CalendarBarInfo[] = [];
  const laneEnds: string[] = [];
  for (const item of sorted) {
    const startDate = item.start_at.slice(0, 10);
    const endDate = item.end_at.slice(0, 10);
    let lane = laneEnds.findIndex(end => end < startDate);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endDate;
    bars.push({ itemId: item.id, color: item.color ?? DEFAULT_CALENDAR_ITEM_COLOR, lane, startDate, endDate });
  }
  return bars;
}
