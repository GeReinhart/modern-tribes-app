import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React, { useMemo } from 'react';

import type { CalendarEvent } from './types.ts';
import { computeMultiDayBars } from './weekLayout.ts';

const GRID_COLUMNS = '44px repeat(7, 1fr)';

interface Props {
  events: CalendarEvent[];
  weekDates: string[];
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

function bySingleDayAllDay(events: CalendarEvent[], weekDates: string[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const date of weekDates) {
    map.set(date, events.filter(e => e.all_day && e.start_at.slice(0, 10) === date && e.end_at.slice(0, 10) === date));
  }
  return map;
}

// The row above the hourly grid: multi-day bars spanning their day columns,
// plus single-day "all day" chips filed under their own column.
const WeekAllDayBanner: React.FC<Props> = ({ events, weekDates, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const [firstDate, lastDate] = [weekDates[0], weekDates[6]];

  const bars = useMemo(
    () => computeMultiDayBars(events).filter(b => b.startDate <= lastDate && b.endDate >= firstDate),
    [events, firstDate, lastDate],
  );
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);
  const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

  const singleDayAllDay = useMemo(() => bySingleDayAllDay(events, weekDates), [events, weekDates]);
  const hasSingleDayChips = [...singleDayAllDay.values()].some(l => l.length > 0);

  if (laneCount === 0 && !hasSingleDayChips) return null;

  return (
    <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>
      {laneCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gridTemplateRows: `repeat(${laneCount}, 22px)`, gap: '2px', marginBottom: hasSingleDayChips ? '4px' : 0 }}>
          {bars.map(bar => {
            const event = eventsById.get(bar.eventId);
            if (!event) return null;
            const startIdx = weekDates.indexOf(bar.startDate);
            const endIdx = weekDates.indexOf(bar.endDate);
            const colStart = startIdx === -1 ? 0 : startIdx;
            const colEnd = endIdx === -1 ? 6 : endIdx;
            const radius = `${startIdx === -1 ? 0 : 6}px ${endIdx === -1 ? 0 : 6}px ${endIdx === -1 ? 0 : 6}px ${startIdx === -1 ? 0 : 6}px`;
            return (
              <div
                key={bar.eventId}
                onClick={() => onSelectEvent(event)}
                style={{
                  gridColumn: `${colStart + 2} / ${colEnd + 3}`, gridRow: bar.lane + 1,
                  display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden',
                  padding: '2px 6px', borderRadius: radius,
                  backgroundColor: event.color + '18', border: `1.5px solid ${event.color}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: event.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {event.title}
                </span>
                {onEditEvent && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
                  >
                    <ThemedSvgIcon name="pencil" color={event.color} size={12} />
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
              {(singleDayAllDay.get(date) ?? []).map(ev => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  style={{
                    cursor: 'pointer', padding: '2px 6px', borderRadius: '8px',
                    backgroundColor: ev.color + '18', border: `1.5px solid ${ev.color}`,
                    fontSize: '10px', fontWeight: 700, color: ev.color,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeekAllDayBanner;
