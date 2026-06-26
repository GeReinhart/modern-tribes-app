import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import DayEventCard from './DayEventCard.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { buildDayLayout } from './eventDayViewLayout.ts';

const HOUR_H = 64;
const MIN_EVENT_H = 18;
const DEFAULT_START_H = 8;
const DEFAULT_END_H = 20;

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

function isoToDecimalH(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function computeRange(events: CalendarEvent[]): { startH: number; endH: number } {
  if (!events.length) return { startH: DEFAULT_START_H, endH: DEFAULT_END_H };
  const starts = events.map(e => isoToDecimalH(e.start_at));
  const ends = events.map(e => isoToDecimalH(e.end_at));
  return {
    startH: Math.max(0, Math.floor(Math.min(...starts)) - 1),
    endH: Math.min(24, Math.ceil(Math.max(...ends)) + 1),
  };
}

const EventDayView: React.FC<Props> = ({ events, labels, persons, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const allDayEvents = events.filter(e => e.all_day);
  const timedEvents = events.filter(e => !e.all_day);
  const layout = buildDayLayout(timedEvents);

  const { startH, endH } = computeRange(timedEvents);
  const visibleHours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const containerH = (endH - startH) * HOUR_H;

  const toPx = (iso: string) => (isoToDecimalH(iso) - startH) * HOUR_H;

  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPx = (nowH - startH) * HOUR_H;
  const showNow = nowH >= startH && nowH <= endH;

  const eventColor = (event: CalendarEvent): string => {
    const label = labels.find(l => event.label_ids.includes(l.id));
    return label?.color ?? theme.colors.primary;
  };

  return (
    <div>
      {allDayEvents.length > 0 && (
        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '5px', letterSpacing: '0.05em' }}>
            {t('features.events.allDay')}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {allDayEvents.map(ev => {
              const color = eventColor(ev);
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

        {/* Hour labels */}
        <div style={{ width: 44, flexShrink: 0, position: 'relative' }}>
          {visibleHours.map(h => (
            <span
              key={h}
              style={{
                position: 'absolute', top: (h - startH) * HOUR_H - 9,
                right: 6, fontSize: '12px', fontWeight: 600,
                color: theme.colors.text, lineHeight: 1, userSelect: 'none',
                opacity: 0.7,
              }}
            >
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, position: 'relative', borderLeft: `2px solid ${theme.colors.border}` }}>
          {/* Alternating hour bands */}
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

          {/* Hour lines */}
          {visibleHours.map(h => (
            <div
              key={h}
              style={{
                position: 'absolute', top: (h - startH) * HOUR_H, left: 0, right: 0,
                height: 1, backgroundColor: theme.colors.border,
              }}
            />
          ))}

          {/* Current time indicator */}
          {showNow && (
            <div
              style={{
                position: 'absolute', top: nowPx, left: 0, right: 0,
                height: 2, backgroundColor: theme.colors.danger, zIndex: 2, pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute', left: -5, top: -4,
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: theme.colors.danger,
                }}
              />
            </div>
          )}

          {/* Events */}
          {layout.map(({ event, col, totalCols }) => {
            const top = toPx(event.start_at);
            const height = Math.max(toPx(event.end_at) - top, MIN_EVENT_H);
            return (
              <DayEventCard
                key={event.id}
                event={event}
                color={eventColor(event)}
                top={top}
                height={height}
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
      </div>}
    </div>
  );
};

export default EventDayView;
