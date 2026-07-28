import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import DayEventCard from './DayEventCard.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { buildDayLayout, clipToDay, dayBoundsMs, spansFullDay } from './eventDayViewLayout.ts';
import type { ClippedRange } from './eventDayViewLayout.ts';

const HOUR_H = 64;
const MIN_EVENT_H = 18;
const DEFAULT_START_H = 8;
const DEFAULT_END_H = 20;

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  selectedDate: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

function computeRange(ranges: ClippedRange[]): { startH: number; endH: number } {
  if (!ranges.length) return { startH: DEFAULT_START_H, endH: DEFAULT_END_H };
  return {
    startH: Math.max(0, Math.floor(Math.min(...ranges.map(r => r.startH))) - 1),
    endH: Math.min(24, Math.ceil(Math.max(...ranges.map(r => r.endH))) + 1),
  };
}

const EventDayView: React.FC<Props> = ({ events, labels, persons, selectedDate, onSelectEvent, onEditEvent }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const allDayEvents = events.filter(e => e.all_day || spansFullDay(e, selectedDate));
  const timedEvents = events.filter(e => !e.all_day && !spansFullDay(e, selectedDate));
  const layout = buildDayLayout(timedEvents);

  const bounds = dayBoundsMs(selectedDate);
  const clippedRanges = new Map(timedEvents.map(e => [e.id, clipToDay(e, bounds)]));

  const { startH, endH } = computeRange([...clippedRanges.values()]);
  const visibleHours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const containerH = (endH - startH) * HOUR_H;

  const toPx = (h: number) => (h - startH) * HOUR_H;

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
            const range = clippedRanges.get(event.id)!;
            const top = toPx(range.startH);
            const height = Math.max(toPx(range.endH) - top, MIN_EVENT_H);
            const midnight = t('features.events.midnight');
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
      </div>}
    </div>
  );
};

export default EventDayView;
