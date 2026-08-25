import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { isoDate } from './calendarDateUtils.ts';

interface Props {
  weekDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

function fmtRangeBound(dateStr: string, locale: string, withYear: boolean): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined });
}

const CalendarWeekHeader: React.FC<Props> = ({ weekDates, selectedDate, onSelectDate, onPrevWeek, onNextWeek }) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const today = isoDate(new Date());
  const [firstDate, lastDate] = [weekDates[0], weekDates[6]];
  const crossesYear = firstDate.slice(0, 4) !== lastDate.slice(0, 4);

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button type="button" onClick={onPrevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
          <ThemedSvgIcon name="arrow-left" color="currentColor" size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-md)', color: theme.colors.text, textTransform: 'capitalize' }}>
          {fmtRangeBound(firstDate, i18n.language, crossesYear)} – {fmtRangeBound(lastDate, i18n.language, true)}
        </span>
        <button type="button" onClick={onNextWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
          <ThemedSvgIcon name="arrow-right" color="currentColor" size={18} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {weekDates.map(dateStr => {
          const d = new Date(dateStr + 'T12:00:00');
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '4px 2px', border: 'none', cursor: 'pointer', borderRadius: '8px',
                backgroundColor: isSelected ? theme.colors.primary : isToday ? theme.colors.primary + '22' : 'transparent',
                color: isSelected ? theme.colors.surface : theme.colors.text,
              }}
            >
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {d.toLocaleDateString(i18n.language, { weekday: 'short' })}
              </span>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: isToday || isSelected ? 700 : 400 }}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWeekHeader;
