import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import { useMemo } from 'react';

import { computeMultiDayBars } from './calendarBarLayout.ts';
import { DEFAULT_CALENDAR_ITEM_COLOR } from './types.ts';
import type { CalendarItem } from './types.ts';

const GRID_COLUMNS = '44px repeat(7, 1fr)';

interface Props<T extends CalendarItem> {
  items: T[];
  weekDates: string[];
  onSelectItem: (item: T) => void;
  onEditItem?: (item: T) => void;
}

function bySingleDayAllDay<T extends CalendarItem>(items: T[], weekDates: string[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const date of weekDates) {
    map.set(date, items.filter(i => i.all_day && i.start_at.slice(0, 10) === date && i.end_at.slice(0, 10) === date));
  }
  return map;
}

// The row above the hourly grid: multi-day bars spanning their day columns,
// plus single-day "all day" chips filed under their own column.
function CalendarWeekAllDayBanner<T extends CalendarItem>({ items, weekDates, onSelectItem, onEditItem }: Props<T>) {
  const { theme } = useTheme();
  const [firstDate, lastDate] = [weekDates[0], weekDates[6]];

  const bars = useMemo(
    () => computeMultiDayBars(items).filter(b => b.startDate <= lastDate && b.endDate >= firstDate),
    [items, firstDate, lastDate],
  );
  const itemsById = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

  const singleDayAllDay = useMemo(() => bySingleDayAllDay(items, weekDates), [items, weekDates]);
  const hasSingleDayChips = [...singleDayAllDay.values()].some(l => l.length > 0);

  if (laneCount === 0 && !hasSingleDayChips) return null;

  return (
    <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>
      {laneCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gridTemplateRows: `repeat(${laneCount}, 22px)`, gap: '2px', marginBottom: hasSingleDayChips ? '4px' : 0 }}>
          {bars.map(bar => {
            const item = itemsById.get(bar.itemId);
            if (!item) return null;
            const startIdx = weekDates.indexOf(bar.startDate);
            const endIdx = weekDates.indexOf(bar.endDate);
            const colStart = startIdx === -1 ? 0 : startIdx;
            const colEnd = endIdx === -1 ? 6 : endIdx;
            const radius = `${startIdx === -1 ? 0 : 6}px ${endIdx === -1 ? 0 : 6}px ${endIdx === -1 ? 0 : 6}px ${startIdx === -1 ? 0 : 6}px`;
            const color = item.color ?? DEFAULT_CALENDAR_ITEM_COLOR;
            return (
              <div
                key={bar.itemId}
                onClick={() => onSelectItem(item)}
                style={{
                  gridColumn: `${colStart + 2} / ${colEnd + 3}`, gridRow: bar.lane + 1,
                  display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden',
                  padding: '2px 6px', borderRadius: radius,
                  backgroundColor: color + '18', border: `1.5px solid ${color}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {item.title}
                </span>
                {onEditItem && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
                  >
                    <ThemedSvgIcon name="pencil" color={color} size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasSingleDayChips && (
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: '2px' }}>
          <div />
          {weekDates.map(date => (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(singleDayAllDay.get(date) ?? []).map(item => {
                const color = item.color ?? DEFAULT_CALENDAR_ITEM_COLOR;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    style={{
                      cursor: 'pointer', padding: '2px 6px', borderRadius: '8px',
                      backgroundColor: color + '18', border: `1.5px solid ${color}`,
                      fontSize: '10px', fontWeight: 700, color,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarWeekAllDayBanner;
