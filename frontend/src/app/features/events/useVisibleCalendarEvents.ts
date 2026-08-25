import { getWeekDates } from '@/app/platform/core/layout/themes/components/calendar/calendarDateUtils.ts';

import { useMemo } from 'react';

import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import type { CalendarViewMode } from './useCalendarViewToggle.ts';

export interface VisibleCalendarEvents<E extends CalendarEvent> {
  weekDates: string[];
  visibleEvents: E[];
  visibleLabels: FeatureLabel[];
  visiblePersons: PersonOption[];
}

// Computes the events (and the labels/persons found on them) visible in the
// current day or week range. Replaces the near-identical dayEvents/dayLabels/
// dayPersons logic that used to live separately in EventsTab and
// DashboardPlanningTab.
export function useVisibleCalendarEvents<E extends CalendarEvent>(
  events: E[],
  labels: FeatureLabel[],
  persons: PersonOption[],
  selectedDate: string,
  viewMode: CalendarViewMode,
): VisibleCalendarEvents<E> {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const visibleEvents = useMemo(() => {
    const [rangeStart, rangeEnd] = viewMode === 'day' ? [selectedDate, selectedDate] : [weekDates[0], weekDates[6]];
    return events
      .filter(e => e.start_at.slice(0, 10) <= rangeEnd && e.end_at.slice(0, 10) >= rangeStart)
      .sort((a, b) => a.start_at.localeCompare(b.start_at));
  }, [events, selectedDate, viewMode, weekDates]);

  const visibleLabels = useMemo((): FeatureLabel[] => {
    const ids = new Set(visibleEvents.flatMap(e => e.label_ids));
    return labels.filter(l => ids.has(l.id));
  }, [visibleEvents, labels]);

  const visiblePersons = useMemo((): PersonOption[] => {
    const ids = new Set(visibleEvents.flatMap(e => e.participant_ids));
    return persons.filter(p => ids.has(p.id));
  }, [visibleEvents, persons]);

  return { weekDates, visibleEvents, visibleLabels, visiblePersons };
}
