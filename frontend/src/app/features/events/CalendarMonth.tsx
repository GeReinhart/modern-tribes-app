import CalendarMonthGrid from '@/app/platform/core/layout/themes/components/calendar/CalendarMonthGrid.tsx';
import type { CalendarMonthDayBadge } from '@/app/platform/core/layout/themes/components/calendar/types.ts';

import React, { useMemo } from 'react';

import type { CalendarEvent } from './types.ts';

interface Props {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  taskDates?: Set<string>;
  journalDates?: Set<string>;
}

const TASK_DOT_COLOR = '#f97316';

const JOURNAL_DOT_COLOR = '#8b5cf6';

// Thin events-feature wrapper around the shared month grid: turns the
// dashboard's task-due / journal-entry day markers into the grid's generic
// dayBadges, which know nothing about tasks or journals.
const CalendarMonth: React.FC<Props> = ({
  year, month, events, selectedDate, onSelectDate, onPrevMonth, onNextMonth, taskDates, journalDates,
}) => {
  const dayBadges = useMemo((): CalendarMonthDayBadge[] => [
    ...(taskDates ? [{ dates: taskDates, color: TASK_DOT_COLOR, shape: 'square' as const }] : []),
    ...(journalDates ? [{ dates: journalDates, color: JOURNAL_DOT_COLOR, shape: 'dot' as const }] : []),
  ], [taskDates, journalDates]);

  return (
    <CalendarMonthGrid
      year={year} month={month} items={events}
      selectedDate={selectedDate} onSelectDate={onSelectDate}
      onPrevMonth={onPrevMonth} onNextMonth={onNextMonth}
      dayBadges={dayBadges}
    />
  );
};

export default CalendarMonth;
