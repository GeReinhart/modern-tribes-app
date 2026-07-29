import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import EventTimelineColumn from './EventTimelineColumn.tsx';
import HourLabelsGutter from './HourLabelsGutter.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { clipToDay, computeRange, dayBoundsMs, spansFullDay } from './eventDayViewLayout.ts';

const HOUR_H = 64;

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  selectedDate: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

const EventDayView: React.FC<Props> = ({ events, labels, persons, selectedDate, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const allDayEvents = events.filter(e => e.all_day || spansFullDay(e, selectedDate));
  const timedEvents = events.filter(e => !e.all_day && !spansFullDay(e, selectedDate));

  const bounds = dayBoundsMs(selectedDate);
  const clippedRanges = timedEvents.map(e => clipToDay(e, bounds));

  const { startH, endH } = computeRange(clippedRanges);
  const containerH = (endH - startH) * HOUR_H;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPx = (nowH - startH) * HOUR_H;
  const showNow = selectedDate === todayStr && nowH >= startH && nowH <= endH;

  return (
    <div>
      {allDayEvents.length > 0 && (
        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '5px', letterSpacing: '0.05em' }}>
            {t('features.events.allDay')}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {allDayEvents.map(ev => {
              const color = ev.color;
              return (
                <div
                  key={ev.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 10px', borderRadius: '12px', backgroundColor: color + '18', border: `1.5px solid ${color}` }}
                >
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color }}>{ev.title}</span>
                  <button type="button" onClick={() => onSelectEvent(ev)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                    <ThemedSvgIcon name="eye" color={color} size={14} />
                  </button>
                  {onEditEvent && (
                    <button type="button" onClick={() => onEditEvent(ev)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                      <ThemedSvgIcon name="pencil" color={color} size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <span style={{ display: 'block', fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('features.events.noEvents')}
        </span>
      )}

      {timedEvents.length > 0 && <div style={{ display: 'flex', position: 'relative', height: containerH }}>
        <HourLabelsGutter startH={startH} endH={endH} />

        <EventTimelineColumn
          date={selectedDate}
          events={timedEvents}
          labels={labels}
          persons={persons}
          startH={startH}
          endH={endH}
          now={{ show: showNow, px: nowPx }}
          onSelectEvent={onSelectEvent}
          onEditEvent={onEditEvent}
        />
      </div>}
    </div>
  );
};

export default EventDayView;
