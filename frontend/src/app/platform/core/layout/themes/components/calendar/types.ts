import type { ReactNode } from 'react';

// Feature-agnostic shape any calendar-rendering feature (events, meals, ...)
// maps its own domain objects into. Only what the grid/layout rendering
// needs to lay items out and paint them by default lives here — feature-only
// fields (participants, size, labels, ...) stay in the feature's own type.
export interface CalendarItem {
  id: string;
  title: string;
  start_at: string; // ISO datetime
  end_at: string; // ISO datetime
  all_day?: boolean;
  color?: string;
}

export const DEFAULT_CALENDAR_ITEM_COLOR = '#6b7280';

// Extra context the grid has already computed for an item (day-clipped time
// labels, e.g. "00:00 → 24:00" for a multi-day item on an intermediate day,
// and the pixel height its slot was given) and hands to a custom renderItem
// so it doesn't have to redo that math.
export interface CalendarItemRenderContext {
  startLabel: string;
  endLabel: string;
  heightPx: number;
}

export type CalendarItemRenderer<T extends CalendarItem = CalendarItem> = (
  item: T,
  ctx: CalendarItemRenderContext,
) => ReactNode;

// A row of markers a caller wants overlaid on the month grid for reasons
// unrelated to calendar items (e.g. a dashboard flags days with a task due,
// or a journal entry) — kept generic so the platform component never has to
// know what a "task" or a "journal" is.
export interface CalendarMonthDayBadge {
  dates: Set<string>;
  color: string;
  shape?: 'dot' | 'square';
}

export interface CalendarGridCallbacks<T extends CalendarItem> {
  onSelectItem: (item: T) => void;
  onEditItem?: (item: T) => void;
}
