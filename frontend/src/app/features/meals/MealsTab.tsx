import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CreateMealModal from './CreateMealModal.tsx';
import { useMeals } from './hooks.ts';
import { addDaysIso, todayIso } from './mealDateUtils.ts';
import MealCalendarCard from './MealCalendarCard.tsx';
import MealDetailModal from './MealDetailModal.tsx';
import MealsWeekGrid from './MealsWeekGrid.tsx';
import { Meal } from './types.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
  tribeId: string;
  projectId: string;
}

const MealsTab: React.FC<Props> = ({ featureInstanceId, canEdit, projectId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { meals, persons, recipes, error, createMeal, updateMeal, archiveMeal, setParticipants, toggleRecipe } =
    useMeals(featureInstanceId, projectId);

  const [selectedDate, setSelectedDate] = useState(todayIso());
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
  const recipeNameById = useMemo(() => new Map(recipes.map((r) => [r.id, r.name])), [recipes]);

  const renderMealCard = (meal: Meal) => (
    <MealCalendarCard
      item={meal}
      recipeNames={meal.recipe_ids.map((id) => recipeNameById.get(id)).filter((n): n is string => !!n)}
      onSelect={() => setOpenMealId(meal.id)}
    />
  );

  return (
    <div>
      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
          {error}
        </div>
      )}

      <MealsWeekGrid
        meals={meals}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevWeek={() => setSelectedDate(addDaysIso(selectedDate, -7))}
        onNextWeek={() => setSelectedDate(addDaysIso(selectedDate, 7))}
        renderMeal={renderMealCard}
      />

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
          onArchive={() => archiveMeal(openMeal.id)}
          onClose={() => setOpenMealId(null)}
        />
      )}
    </div>
  );
};

export default MealsTab;
