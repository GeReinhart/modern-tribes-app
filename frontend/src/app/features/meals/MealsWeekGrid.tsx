import CalendarWeekHeader from '@/app/platform/core/layout/themes/components/calendar/CalendarWeekHeader.tsx';
import { getWeekDates } from '@/app/platform/core/layout/themes/components/calendar/index.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo } from 'react';

import { Meal } from './types.ts';

interface Props {
  meals: Meal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  renderMeal: (meal: Meal) => React.ReactNode;
}

function timeOfDay(meal: Meal): string {
  return meal.start_at.slice(11, 16);
}

// One row per distinct time-of-day found anywhere in the visible week, sorted
// chronologically — so a meal at 12:00 on Monday and one at 19:00 on Thursday
// land in row 1 and row 2 respectively, keeping meals roughly time-aligned
// across days without an hourly grid.
function buildTimeRows(meals: Meal[]): string[] {
  return Array.from(new Set(meals.map(timeOfDay))).sort();
}

function groupByCell(meals: Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = `${meal.start_at.slice(0, 10)}|${timeOfDay(meal)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(meal);
  }
  return map;
}

// Meals plan by day, not by hour — no hourly gridlines, just each day's
// meals stacked in chronological rows shared across the week. Reuses the
// shared week header (nav + day highlighting) but not the shared hourly
// timeline grid, which doesn't fit this shape.
const MealsWeekGrid: React.FC<Props> = ({ meals, selectedDate, onSelectDate, onPrevWeek, onNextWeek, renderMeal }) => {
  const { theme } = useTheme();
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekMeals = useMemo(
    () => meals.filter((m) => weekDates.includes(m.start_at.slice(0, 10))),
    [meals, weekDates],
  );
  const timeRows = useMemo(() => buildTimeRows(weekMeals), [weekMeals]);
  const mealsByCell = useMemo(() => groupByCell(weekMeals), [weekMeals]);

  return (
    <div>
      <CalendarWeekHeader
        weekDates={weekDates} selectedDate={selectedDate}
        onSelectDate={onSelectDate} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek}
      />
      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '12px 0' }} />
      {timeRows.length === 0 ? null : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${timeRows.length}, auto)`,
            gap: '6px',
          }}
        >
          {timeRows.map((time, rowIndex) =>
            weekDates.map((date, colIndex) => {
              const cellMeals = mealsByCell.get(`${date}|${time}`) ?? [];
              if (cellMeals.length === 0) return null;
              return (
                <div
                  key={`${date}|${time}`}
                  style={{
                    gridColumn: colIndex + 1, gridRow: rowIndex + 1,
                    display: 'flex', flexDirection: 'column', gap: '4px',
                  }}
                >
                  {cellMeals.map((meal) => <div key={meal.id}>{renderMeal(meal)}</div>)}
                </div>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
};

export default MealsWeekGrid;
