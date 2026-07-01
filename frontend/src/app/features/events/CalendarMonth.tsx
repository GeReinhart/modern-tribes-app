import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { CalendarEvent, FeatureLabel } from './types.ts';

interface Props {
  year: number;
  month: number;
  events: CalendarEvent[];
  labels: FeatureLabel[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  taskDates?: Set<string>;
  journalDates?: Set<string>;
}

interface BarInfo {
  eventId: string;
  color: string;
  lane: number;
  startDate: string;
  endDate: string;
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const DOT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#8b5cf6'];

const TASK_DOT_COLOR = '#f97316';

const JOURNAL_DOT_COLOR = '#8b5cf6';

const CalendarMonth: React.FC<Props> = ({
  year, month, events, labels, selectedDate, onSelectDate, onPrevMonth, onNextMonth, taskDates, journalDates,
}) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const monthName = new Date(year, month, 1).toLocaleString(i18n.language, { month: 'long', year: 'numeric' });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const cur = new Date(ev.start_at.slice(0, 10) + 'T12:00:00');
      const end = new Date(ev.end_at.slice(0, 10) + 'T12:00:00');
      while (cur <= end) {
        const day = cur.toISOString().slice(0, 10);
        const list = map.get(day) ?? [];
        list.push(ev);
        map.set(day, list);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const labelColorMap = useMemo(() => {
    const map = new Map<string, string>();
    labels.forEach((l) => map.set(l.id, l.color));
    return map;
  }, [labels]);

  const multiDayBars = useMemo((): BarInfo[] => {
    const multi = events.filter(e => e.start_at.slice(0, 10) !== e.end_at.slice(0, 10));
    const sorted = [...multi].sort((a, b) => a.start_at.localeCompare(b.start_at));
    const bars: BarInfo[] = [];
    const laneEnds: string[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];
      const startDate = ev.start_at.slice(0, 10);
      const endDate = ev.end_at.slice(0, 10);
      const firstLabel = ev.label_ids[0];
      const color = firstLabel ? (labelColorMap.get(firstLabel) ?? DOT_COLORS[i % DOT_COLORS.length]) : DOT_COLORS[i % DOT_COLORS.length];
      let lane = laneEnds.findIndex(end => end < startDate);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = endDate;
      bars.push({ eventId: ev.id, color, lane, startDate, endDate });
    }
    return bars;
  }, [events, labelColorMap]);

  const getEventColor = (ev: CalendarEvent, index: number): string => {
    const firstLabel = ev.label_ids[0];
    return firstLabel ? (labelColorMap.get(firstLabel) ?? DOT_COLORS[index % DOT_COLORS.length]) : DOT_COLORS[index % DOT_COLORS.length];
  };

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
          const dateStr = isoDate(year, month, day);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const colInGrid = (firstWeekday + i) % 7; // 0=Mon … 6=Sun
          const isWeekStart = colInGrid === 0;
          const isWeekEnd = colInGrid === 6;

          const cellBars = multiDayBars
            .filter(b => b.startDate <= dateStr && b.endDate >= dateStr)
            .sort((a, b) => a.lane - b.lane)
            .slice(0, 3);

          const singleDayEvents = (eventsByDay.get(dateStr) ?? [])
            .filter(ev => ev.start_at.slice(0, 10) === ev.end_at.slice(0, 10));
          const hasTaskDue = taskDates?.has(dateStr) ?? false;
          const hasJournalEntry = journalDates?.has(dateStr) ?? false;

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
                      <div key={bar.eventId} style={{
                        height: '5px', backgroundColor: bg, borderRadius: radius,
                        marginLeft: visualStart ? '0' : '-2px',
                        marginRight: visualEnd ? '0' : '-2px',
                      }} />
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '6px' }}>
                {singleDayEvents.slice(0, 3).map((ev, idx) => (
                  <span key={ev.id} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? theme.colors.surface : getEventColor(ev, idx), flexShrink: 0 }} />
                ))}
              </div>
              {hasTaskDue && (
                <span style={{ width: '5px', height: '5px', borderRadius: '2px', backgroundColor: isSelected ? theme.colors.surface : TASK_DOT_COLOR, flexShrink: 0 }} />
              )}
              {hasJournalEntry && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? theme.colors.surface : JOURNAL_DOT_COLOR, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonth;
