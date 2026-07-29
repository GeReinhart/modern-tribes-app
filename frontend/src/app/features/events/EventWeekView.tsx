import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import EventTimelineColumn from './EventTimelineColumn.tsx';
import HourLabelsGutter from './HourLabelsGutter.tsx';
import WeekAllDayBanner from './WeekAllDayBanner.tsx';
import WeekViewHeader from './WeekViewHeader.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { clipToDay, computeRange, dayBoundsMs, spansFullDay } from './eventDayViewLayout.ts';
import { getWeekDates } from './weekLayout.ts';

const HOUR_H = 64;

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

function timedEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter(e =>
    !e.all_day && !spansFullDay(e, date) &&
    e.start_at.slice(0, 10) <= date && e.end_at.slice(0, 10) >= date,
  );
}

const EventWeekView: React.FC<Props> = ({ events, labels, persons, selectedDate, onSelectDate, onPrevWeek, onNextWeek, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const timedByDate = useMemo(
    () => new Map(weekDates.map(date => [date, timedEventsForDate(events, date)])),
    [events, weekDates],
  );

  const clippedRanges = weekDates.flatMap(date => {
    const bounds = dayBoundsMs(date);
    return (timedByDate.get(date) ?? []).map(e => clipToDay(e, bounds));
  });
  const { startH, endH } = computeRange(clippedRanges);
  const containerH = (endH - startH) * HOUR_H;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPx = (nowH - startH) * HOUR_H;
  const showNow = nowH >= startH && nowH <= endH;

  const hasTimedEvents = clippedRanges.length > 0;

  return (
    <div>
      <WeekViewHeader
        weekDates={weekDates} selectedDate={selectedDate}
        onSelectDate={onSelectDate} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek}
      />

      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '12px 0' }} />

      <WeekAllDayBanner events={events} weekDates={weekDates} onSelectEvent={onSelectEvent} onEditEvent={onEditEvent} />

      {!hasTimedEvents && (
        <span style={{ display: 'block', fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('features.events.noEventsWeek')}
        </span>
      )}

      {hasTimedEvents && (
        <div style={{ display: 'flex', position: 'relative', height: containerH }}>
          <HourLabelsGutter startH={startH} endH={endH} />
          {weekDates.map(date => (
            <EventTimelineColumn
              key={date}
              date={date}
              events={timedByDate.get(date) ?? []}
              labels={labels}
              persons={persons}
              startH={startH}
              endH={endH}
              now={{ show: showNow && date === todayStr, px: nowPx }}
              onSelectEvent={onSelectEvent}
              onEditEvent={onEditEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventWeekView;
