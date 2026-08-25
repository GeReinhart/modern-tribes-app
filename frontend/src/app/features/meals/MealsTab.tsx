import {
  CalendarDayGrid, CalendarMonthGrid, CalendarWeekGrid,
} from '@/app/platform/core/layout/themes/components/calendar/index.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CreateMealModal from './CreateMealModal.tsx';
import { useMeals } from './hooks.ts';
import { addDaysIso, todayIso } from './mealDateUtils.ts';
import MealDetailModal from './MealDetailModal.tsx';
import { Meal } from './types.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
  tribeId: string;
  projectId: string;
}

type ViewMode = 'month' | 'week' | 'day';

const MealsTab: React.FC<Props> = ({ featureInstanceId, canEdit, projectId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { meals, persons, recipes, error, createMeal, updateMeal, removeMeal, setParticipants, toggleRecipe } =
    useMeals(featureInstanceId, projectId);

  const [view, setView] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [creating, setCreating] = useState(false);
  const [openMealId, setOpenMealId] = useState<string | null>(null);

  const tabActions = useMemo(
    () =>
      canEdit
        ? [{ icon: 'plus' as const, label: t('features.meals.newMeal'), onClick: () => setCreating(true) }]
        : [],
    [canEdit, t],
  );
  useRegisterTabActions(tabActions);

  const openMeal = meals.find((m) => m.id === openMealId) || null;
  const dayMeals = meals.filter((m) => m.start_at.slice(0, 10) === selectedDate);

  return (
    <div>
      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
          <ThemedButton key={mode} variant={view === mode ? 'primary' : 'ghost'} onClick={() => setView(mode)}>
            {t(`features.meals.view.${mode}`)}
          </ThemedButton>
        ))}
      </div>

      {view === 'month' && (
        <CalendarMonthGrid<Meal>
          year={monthCursor.year}
          month={monthCursor.month}
          items={meals}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setView('day');
          }}
          onPrevMonth={() => setMonthCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          onNextMonth={() => setMonthCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
        />
      )}

      {view === 'week' && (
        <CalendarWeekGrid<Meal>
          items={meals}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevWeek={() => setSelectedDate(addDaysIso(selectedDate, -7))}
          onNextWeek={() => setSelectedDate(addDaysIso(selectedDate, 7))}
          onSelectItem={(meal) => setOpenMealId(meal.id)}
          onEditItem={canEdit ? (meal) => setOpenMealId(meal.id) : undefined}
        />
      )}

      {view === 'day' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
            <ThemedButton variant="ghost" onClick={() => setSelectedDate(addDaysIso(selectedDate, -1))}>
              {'<'}
            </ThemedButton>
            <span>{selectedDate}</span>
            <ThemedButton variant="ghost" onClick={() => setSelectedDate(addDaysIso(selectedDate, 1))}>
              {'>'}
            </ThemedButton>
          </div>
          <CalendarDayGrid<Meal>
            items={dayMeals}
            selectedDate={selectedDate}
            onSelectItem={(meal) => setOpenMealId(meal.id)}
            onEditItem={canEdit ? (meal) => setOpenMealId(meal.id) : undefined}
          />
        </>
      )}

      {creating && (
        <CreateMealModal
          featureInstanceId={featureInstanceId}
          defaultDate={selectedDate}
          recipes={recipes}
          onClose={() => setCreating(false)}
          onCreate={async (data, recipeIds) => {
            const created = await createMeal(data);
            if (!created) return;
            for (const recipeId of recipeIds) {
              await toggleRecipe(created.id, recipeId);
            }
            setCreating(false);
          }}
        />
      )}

      {openMeal && (
        <MealDetailModal
          meal={openMeal}
          persons={persons}
          recipes={recipes}
          canEdit={canEdit}
          onUpdate={(data) => updateMeal(openMeal.id, data).then(() => undefined)}
          onSetParticipants={(personIds) => setParticipants(openMeal.id, personIds)}
          onToggleRecipe={(recipeId) => toggleRecipe(openMeal.id, recipeId)}
          onDelete={() => removeMeal(openMeal.id)}
          onClose={() => setOpenMealId(null)}
        />
      )}
    </div>
  );
};

export default MealsTab;
