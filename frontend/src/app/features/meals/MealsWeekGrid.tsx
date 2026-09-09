import CalendarWeekHeader from '@/app/platform/core/layout/themes/components/calendar/CalendarWeekHeader.tsx';
import { getWeekDates, isoDate } from '@/app/platform/core/layout/themes/components/calendar/index.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MEAL_SLOTS, slotFromTime } from './mealDateUtils.ts';
import { Meal } from './types.ts';

interface Props {
  meals: Meal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  renderMeal: (meal: Meal) => React.ReactNode;
}

function groupByCell(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = `${meal.start_at.slice(0, 10)}|${slotFromTime(meal.start_at.slice(11, 16))}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(meal);
  }
  return map;
}

// Meals plan by day, one row per day with matin/midi/soir as columns — a meal lands in whichever
// column its start hour is closest to (see slotFromTime), so both slot-picked and legacy/custom
// times land somewhere sensible. Reuses the shared week header (nav + day highlighting) but not
// the shared hourly timeline grid, which doesn't fit this shape.
const MealsWeekGrid: React.FC<Props> = ({ meals, selectedDate, onSelectDate, onPrevWeek, onNextWeek, renderMeal }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const today = isoDate(new Date());
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekMeals = useMemo(
    () => meals.filter((m) => weekDates.includes(m.start_at.slice(0, 10))),
    [meals, weekDates],
  );
  const mealsByCell = useMemo(() => groupByCell(weekMeals), [weekMeals]);

  return (
    <div>
      <CalendarWeekHeader
        weekDates={weekDates} selectedDate={selectedDate}
        onSelectDate={onSelectDate} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek}
      />
      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '12px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', gap: '6px' }}>
        <div />
        {MEAL_SLOTS.map((slot) => (
          <div
            key={slot}
            style={{
              fontSize: 'var(--font-xs)', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: theme.colors.secondary, textAlign: 'center',
            }}
          >
            {t(`features.meals.slot.${slot}`)}
          </div>
        ))}
        {weekDates.map((date) => {
          const d = new Date(`${date}T12:00:00`);
          const isToday = date === today;
          return (
            <React.Fragment key={date}>
              <div
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  color: isToday ? theme.colors.primary : theme.colors.text,
                }}
              >
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {d.toLocaleDateString(i18n.language, { weekday: 'short' })}
                </span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: isToday ? 700 : 400 }}>{d.getDate()}</span>
              </div>
              {MEAL_SLOTS.map((slot) => {
                const cellMeals = mealsByCell.get(`${date}|${slot}`) ?? [];
                return (
                  <div key={slot} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cellMeals.map((meal) => <div key={meal.id}>{renderMeal(meal)}</div>)}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MealsWeekGrid;
