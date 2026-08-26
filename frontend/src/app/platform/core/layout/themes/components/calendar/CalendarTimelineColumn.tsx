import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import { useTranslation } from 'react-i18next';

import { CALENDAR_HOUR_HEIGHT } from './CalendarHourLabelsGutter.tsx';
import DefaultCalendarItemCard from './DefaultCalendarItemCard.tsx';
import { buildDayLayout, clipToDay, dayBoundsMs } from './calendarDayLayout.ts';
import type { CalendarItem, CalendarItemRenderer } from './types.ts';

const MIN_ITEM_H = 18;

export interface NowIndicator {
  show: boolean;
  px: number;
}

interface Props<T extends CalendarItem> {
  date: string;
  items: T[];
  startH: number;
  endH: number;
  now: NowIndicator;
  onSelectItem: (item: T) => void;
  onEditItem?: (item: T) => void;
  renderItem?: CalendarItemRenderer<T>;
  // Opt-in: lets an item's rendered content grow past its time-slot height
  // instead of being clipped. Off by default (events' dense calendar relies
  // on clipping); a feature with few, content-heavy items per slot can opt in.
  allowOverflow?: boolean;
}

// Renders one day's worth of the hourly grid: alternating hour bands, hour
// lines, the current-time indicator and the day's items. Shared by the
// single-day timeline (CalendarDayGrid) and each column of the week grid
// (CalendarWeekGrid) so the two views stay pixel-identical.
function CalendarTimelineColumn<T extends CalendarItem>({
  date, items, startH, endH, now, onSelectItem, onEditItem, renderItem, allowOverflow = false,
}: Props<T>) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const midnight = t('calendar.midnight');

  const bounds = dayBoundsMs(date);
  const clippedRanges = new Map(items.map(item => [item.id, clipToDay(item, bounds)]));
  const layout = buildDayLayout(items);
  const visibleHours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const toPx = (h: number) => (h - startH) * CALENDAR_HOUR_HEIGHT;

  return (
    <div style={{ flex: 1, position: 'relative', borderLeft: `2px solid ${theme.colors.border}` }}>
      {visibleHours.slice(0, -1).map(h => (
        <div
          key={h}
          style={{
            position: 'absolute', top: (h - startH) * CALENDAR_HOUR_HEIGHT, left: 0, right: 0,
            height: CALENDAR_HOUR_HEIGHT,
            backgroundColor: h % 2 === 0 ? `${theme.colors.border}33` : 'transparent',
          }}
        />
      ))}

      {visibleHours.map(h => (
        <div
          key={h}
          style={{
            position: 'absolute', top: (h - startH) * CALENDAR_HOUR_HEIGHT, left: 0, right: 0,
            height: 1, backgroundColor: theme.colors.border,
          }}
        />
      ))}

      {now.show && (
        <div style={{ position: 'absolute', top: now.px, left: 0, right: 0, height: 2, backgroundColor: theme.colors.danger, zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.colors.danger }} />
        </div>
      )}

      {layout.map(({ item, col, totalCols }) => {
        const range = clippedRanges.get(item.id)!;
        const top = toPx(range.startH);
        const height = Math.max(toPx(range.endH) - top, MIN_ITEM_H);
        const colPct = 100 / totalCols;
        const ctx = {
          startLabel: range.startIsMidnight ? midnight : range.startLabel,
          endLabel: range.endIsMidnight ? midnight : range.endLabel,
          heightPx: height,
        };
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute', top, height: allowOverflow ? undefined : height, minHeight: height,
              left: `${col * colPct}%`, width: `calc(${colPct}% - 3px)`,
              boxSizing: 'border-box', overflow: allowOverflow ? 'visible' : 'hidden', zIndex: 1,
            }}
          >
            {renderItem
              ? renderItem(item, ctx)
              : (
                <DefaultCalendarItemCard
                  item={item}
                  startLabel={ctx.startLabel}
                  endLabel={ctx.endLabel}
                  onSelect={() => onSelectItem(item)}
                  onEdit={onEditItem ? () => onEditItem(item) : undefined}
                />
              )}
          </div>
        );
      })}
    </div>
  );
}

export default CalendarTimelineColumn;
