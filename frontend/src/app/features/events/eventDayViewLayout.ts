import type { CalendarEvent } from './types.ts';

export interface LayoutItem {
  event: CalendarEvent;
  col: number;
  totalCols: number;
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
