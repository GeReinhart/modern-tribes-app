import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import DayEventCard from './DayEventCard.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { buildDayLayout, clipToDay, dayBoundsMs } from './eventDayViewLayout.ts';

const HOUR_H = 64;
const MIN_EVENT_H = 18;

export interface NowIndicator {
  show: boolean;
  px: number;
}

interface Props {
  date: string;
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  startH: number;
  endH: number;
  now: NowIndicator;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

// Renders one day's worth of the hourly grid: alternating hour bands, hour
// lines, the current-time indicator and the day's events. Shared by the
// single-day timeline (EventDayView) and each column of the week grid
// (EventWeekView) so the two views stay pixel-identical.
const EventTimelineColumn: React.FC<Props> = ({ date, events, labels, persons, startH, endH, now, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const midnight = t('features.events.midnight');

  const bounds = dayBoundsMs(date);
  const clippedRanges = new Map(events.map(e => [e.id, clipToDay(e, bounds)]));
  const layout = buildDayLayout(events);
  const visibleHours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const toPx = (h: number) => (h - startH) * HOUR_H;

  return (
    <div style={{ flex: 1, position: 'relative', borderLeft: `2px solid ${theme.colors.border}` }}>
      {visibleHours.slice(0, -1).map(h => (
        <div
          key={h}
          style={{
            position: 'absolute', top: (h - startH) * HOUR_H, left: 0, right: 0,
            height: HOUR_H,
            backgroundColor: h % 2 === 0 ? `${theme.colors.border}33` : 'transparent',
          }}
        />
      ))}

      {visibleHours.map(h => (
        <div
          key={h}
          style={{
            position: 'absolute', top: (h - startH) * HOUR_H, left: 0, right: 0,
            height: 1, backgroundColor: theme.colors.border,
          }}
        />
      ))}

      {now.show && (
        <div style={{ position: 'absolute', top: now.px, left: 0, right: 0, height: 2, backgroundColor: theme.colors.danger, zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.colors.danger }} />
        </div>
      )}

      {layout.map(({ event, col, totalCols }) => {
        const range = clippedRanges.get(event.id)!;
        const top = toPx(range.startH);
        const height = Math.max(toPx(range.endH) - top, MIN_EVENT_H);
        return (
          <DayEventCard
            key={event.id}
            event={event}
            color={event.color}
            top={top}
            height={height}
            startLabel={range.startIsMidnight ? midnight : range.startLabel}
            endLabel={range.endIsMidnight ? midnight : range.endLabel}
            col={col}
            totalCols={totalCols}
            labels={labels}
            persons={persons}
            onView={onSelectEvent}
            onEdit={onEditEvent}
          />
        );
      })}
    </div>
  );
};

export default EventTimelineColumn;
