import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { computeMultiDayBars } from './calendarBarLayout.ts';
import type { CalendarBarInfo } from './calendarBarLayout.ts';
import { DEFAULT_CALENDAR_ITEM_COLOR } from './types.ts';
import type { CalendarItem, CalendarMonthDayBadge } from './types.ts';

interface Props<T extends CalendarItem> {
  year: number;
  month: number;
  items: T[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  dayBadges?: CalendarMonthDayBadge[];
}

function isoDateYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function groupBySingleDay<T extends CalendarItem>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const cur = new Date(item.start_at.slice(0, 10) + 'T12:00:00');
    const end = new Date(item.end_at.slice(0, 10) + 'T12:00:00');
    while (cur <= end) {
      const day = cur.toISOString().slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(item);
      map.set(day, list);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

function cellBarsFor(bars: CalendarBarInfo[], dateStr: string): CalendarBarInfo[] {
  return bars
    .filter(b => b.startDate <= dateStr && b.endDate >= dateStr)
    .sort((a, b) => a.lane - b.lane)
    .slice(0, 3);
}

// The month grid: a 7-column calendar with, per day, up to 3 multi-day bars,
// a row of colored dots for single-day items, and any extra badge rows a
// caller asked for. Generic over any feature's CalendarItem.
function CalendarMonthGrid<T extends CalendarItem>({
  year, month, items, selectedDate, onSelectDate, onPrevMonth, onNextMonth, dayBadges,
}: Props<T>) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const monthName = new Date(year, month, 1).toLocaleString(i18n.language, { month: 'long', year: 'numeric' });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const itemsByDay = useMemo(() => groupBySingleDay(items), [items]);
  const multiDayBars = useMemo(() => computeMultiDayBars(items), [items]);

  const dayNames = useMemo(() => {
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d.toLocaleString(i18n.language, { weekday: 'narrow' }).toUpperCase();
    });
  }, [i18n.language]);

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button type="button" onClick={onPrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
          <ThemedSvgIcon name="arrow-left" color="currentColor" size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-md)', color: theme.colors.text, textTransform: 'capitalize' }}>
          {monthName}
        </span>
        <button type="button" onClick={onNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
          <ThemedSvgIcon name="arrow-right" color="currentColor" size={18} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: theme.colors.text, paddingBottom: '6px', letterSpacing: '0.05em' }}>{d}</div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = isoDateYmd(year, month, day);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const colInGrid = (firstWeekday + i) % 7; // 0=Mon … 6=Sun
          const isWeekStart = colInGrid === 0;
          const isWeekEnd = colInGrid === 6;

          const cellBars = cellBarsFor(multiDayBars, dateStr);
          const singleDayItems = (itemsByDay.get(dateStr) ?? [])
            .filter(item => item.start_at.slice(0, 10) === item.end_at.slice(0, 10));

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '4px 2px', border: 'none', cursor: 'pointer', borderRadius: '8px',
                overflow: 'visible',
                backgroundColor: isSelected ? theme.colors.primary : isToday ? theme.colors.primary + '22' : 'transparent',
                color: isSelected ? theme.colors.surface : theme.colors.text,
              }}
            >
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</span>
              {cellBars.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                  {cellBars.map(bar => {
                    const visualStart = bar.startDate === dateStr || isWeekStart;
                    const visualEnd = bar.endDate === dateStr || isWeekEnd;
                    const radius = visualStart && visualEnd ? '3px' : visualStart ? '3px 0 0 3px' : visualEnd ? '0 3px 3px 0' : '0';
                    const bg = isSelected ? theme.colors.surface + 'cc' : bar.color;
                    return (
                      <div key={bar.itemId} style={{
                        height: '5px', backgroundColor: bg, borderRadius: radius,
                        marginLeft: visualStart ? '0' : '-2px',
                        marginRight: visualEnd ? '0' : '-2px',
                      }} />
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '6px' }}>
                {singleDayItems.slice(0, 3).map((item) => (
                  <span key={item.id} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? theme.colors.surface : item.color ?? DEFAULT_CALENDAR_ITEM_COLOR, flexShrink: 0 }} />
                ))}
              </div>
              {(dayBadges ?? []).map((badge, badgeIdx) => badge.dates.has(dateStr) && (
                <span
                  key={badgeIdx}
                  style={{
                    width: '5px', height: '5px', flexShrink: 0,
                    borderRadius: badge.shape === 'square' ? '2px' : '50%',
                    backgroundColor: isSelected ? theme.colors.surface : badge.color,
                  }}
                />
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarMonthGrid;
