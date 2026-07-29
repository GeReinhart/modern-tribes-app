import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import CalendarMonth from '@/app/features/events/CalendarMonth.tsx';
import type { PlanningEvent } from '@/app/features/events/types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  year: number;
  month: number;
  events: PlanningEvent[];
  selectedDate: string;
  taskDates: Set<string>;
  journalDates: Set<string>;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

// The month calendar plus the day-by-day nav bar shown above the Dashboard
// Planning tab's day view. Hidden in week view, which navigates by week instead.
const DashboardDayHeader: React.FC<Props> = ({ year, month, events, selectedDate, taskDates, journalDates, onSelectDate, onPrevMonth, onNextMonth, onPrevDay, onNextDay }) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <>
      <CalendarMonth
        year={year} month={month} events={events}
        selectedDate={selectedDate} onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth} onNextMonth={onNextMonth}
        taskDates={taskDates} journalDates={journalDates}
      />
      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '16px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <button type="button" onClick={onPrevDay} style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', lineHeight: 0 }}>
          <ThemedSvgIcon name="arrow-left" color={theme.colors.text} size={14} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: theme.colors.text, flex: 1, textAlign: 'center' }}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button type="button" onClick={onNextDay} style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', lineHeight: 0 }}>
          <ThemedSvgIcon name="arrow-right" color={theme.colors.text} size={14} />
        </button>
      </div>
    </>
  );
};

export default DashboardDayHeader;
