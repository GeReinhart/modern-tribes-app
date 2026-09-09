import CalendarWeekHeader from '@/app/platform/core/layout/themes/components/calendar/CalendarWeekHeader.tsx';
import { getWeekDates, isoDate } from '@/app/platform/core/layout/themes/components/calendar/index.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MealsWeekExtendRow from './MealsWeekExtendRow.tsx';
import { addDaysIso, MEAL_SLOTS, slotFromTime } from './mealDateUtils.ts';
import { Meal } from './types.ts';

interface Props {
  meals: Meal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  renderMeal: (meal: Meal) => React.ReactNode;
  onRangeChange: (startDate: string, endDate: string) => void;
}

// A displayed period can grow up to this many days beyond the base 7-day week (split freely
// between the "before" and "after" edges), so extending it can't grow the grid unboundedly.
const MAX_EXTRA_DAYS = 14;

function groupByCell(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = `${meal.start_at.slice(0, 10)}|${slotFromTime(meal.start_at)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(meal);
  }
  return map;
}

// Meals plan by day, one row per day with matin/midi/soir as columns — a meal lands in whichever
// column its start hour is closest to (see slotFromTime), so both slot-picked and legacy/custom
// times land somewhere sensible. A slot column is hidden entirely when no meal in the displayed
// week falls into it, so the grid doesn't waste space on always-empty columns.
// Reuses the shared week header for nav only (showDayButtons=false): the per-day rows below
// already show weekday/day-number and double as the day selector, so the header's own day strip
// would just repeat the same information horizontally.
const MealsWeekGrid: React.FC<Props> = ({
  meals, selectedDate, onSelectDate, onPrevWeek, onNextWeek, renderMeal, onRangeChange,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const today = isoDate(new Date());
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const baseWeekStart = weekDates[0];
  const [daysBefore, setDaysBefore] = useState(0);
  const [daysAfter, setDaysAfter] = useState(0);
  // Navigating to a different base week (prev/next) resets the extension; picking a different
  // day within the same displayed period must not, so this depends on the week start, not on
  // selectedDate (which also changes when the user just picks a default day for a new meal).
  useEffect(() => {
    setDaysBefore(0);
    setDaysAfter(0);
  }, [baseWeekStart]);
  const periodDates = useMemo(() => {
    const before = Array.from({ length: daysBefore }, (_, i) => addDaysIso(baseWeekStart, i - daysBefore));
    const after = Array.from({ length: daysAfter }, (_, i) => addDaysIso(weekDates[6], i + 1));
    return [...before, ...weekDates, ...after];
  }, [weekDates, baseWeekStart, daysBefore, daysAfter]);
  useEffect(() => {
    onRangeChange(periodDates[0], periodDates[periodDates.length - 1]);
  }, [periodDates, onRangeChange]);
  const periodMeals = useMemo(
    () => meals.filter((m) => periodDates.includes(m.start_at.slice(0, 10))),
    [meals, periodDates],
  );
  const mealsByCell = useMemo(() => groupByCell(periodMeals), [periodMeals]);
  const visibleSlots = useMemo(
    () => MEAL_SLOTS.filter((slot) => periodMeals.some((m) => slotFromTime(m.start_at) === slot)),
    [periodMeals],
  );
  const columnCount = 1 + visibleSlots.length;
  const canExpand = daysBefore + daysAfter < MAX_EXTRA_DAYS;

  return (
    <div>
      <CalendarWeekHeader
        weekDates={periodDates} selectedDate={selectedDate} showDayButtons={false}
        onSelectDate={onSelectDate} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek}
      />
      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '12px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: `72px repeat(${visibleSlots.length}, 1fr)`, gap: '6px' }}>
        <div style={{ gridRow: 1, gridColumn: 1 }} />
        {visibleSlots.map((slot, slotIndex) => (
          <div
            key={slot}
            style={{
              gridRow: 1, gridColumn: slotIndex + 2,
              fontSize: 'var(--font-xs)', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: theme.colors.secondary, textAlign: 'center',
            }}
          >
            {t(`features.meals.slot.${slot}`)}
          </div>
        ))}
        <MealsWeekExtendRow
          gridRow={2}
          columnCount={columnCount} canExpand={canExpand} canCollapse={daysBefore > 0}
          onExpand={() => setDaysBefore((n) => n + 1)} onCollapse={() => setDaysBefore((n) => n - 1)}
        />
        {periodDates.map((date, dateIndex) => {
          const d = new Date(`${date}T12:00:00`);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const gridRow = dateIndex + 3;
          return (
            <React.Fragment key={date}>
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                style={{
                  gridRow, gridColumn: 1,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left',
                  background: isSelected ? theme.colors.primary + '22' : 'none', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', padding: '2px 4px',
                  color: isToday ? theme.colors.primary : theme.colors.text,
                }}
              >
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {d.toLocaleDateString(i18n.language, { weekday: 'short' })}
                </span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: isToday ? 700 : 400 }}>{d.getDate()}</span>
              </button>
              {visibleSlots.map((slot, slotIndex) => {
                const cellMeals = mealsByCell.get(`${date}|${slot}`) ?? [];
                return (
                  <div key={slot} style={{ gridRow, gridColumn: slotIndex + 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cellMeals.map((meal) => <div key={meal.id}>{renderMeal(meal)}</div>)}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
        <MealsWeekExtendRow
          gridRow={periodDates.length + 3}
          columnCount={columnCount} canExpand={canExpand} canCollapse={daysAfter > 0}
          onExpand={() => setDaysAfter((n) => n + 1)} onCollapse={() => setDaysAfter((n) => n - 1)}
        />
      </div>
    </div>
  );
};

export default MealsWeekGrid;
