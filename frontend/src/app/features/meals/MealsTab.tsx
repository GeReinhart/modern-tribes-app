import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import CreateMealModal from './CreateMealModal.tsx';
import { useMeals } from './hooks.ts';
import { useMealsPdfDownload } from './useMealsPdfDownload.ts';
import { addDaysIso, todayIso } from './mealDateUtils.ts';
import MealCalendarCard from './MealCalendarCard.tsx';
import MealDetailModal from './MealDetailModal.tsx';
import MealsWeekGrid from './MealsWeekGrid.tsx';
import { Meal, RecipeOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
  tribeId: string;
  projectId: string;
}

const MealsTab: React.FC<Props> = ({ featureInstanceId, canEdit, tribeId, projectId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { meals, persons, recipes, error, createMeal, updateMeal, archiveMeal, setParticipants, toggleRecipe } =
    useMeals(featureInstanceId, projectId);
  const viewRecipe = (recipeId: string) => navigate(`/app/tribes/${tribeId}/projects/${projectId}/recipes/${recipeId}/present`);

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [creating, setCreating] = useState(false);
  const [openMealId, setOpenMealId] = useState<string | null>(null);
  const [displayedRange, setDisplayedRange] = useState({ start: todayIso(), end: todayIso() });
  const handleRangeChange = useCallback((start: string, end: string) => {
    setDisplayedRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);
  const { download: downloadPdf, downloading: downloadingPdf } =
    useMealsPdfDownload(featureInstanceId, displayedRange.start, displayedRange.end);

  const tabActions = useMemo(() => {
    const actions: MenuAction[] = [
      { icon: 'download', label: t('features.meals.exportPdf'), onClick: downloadPdf, disabled: downloadingPdf },
    ];
    if (canEdit) {
      actions.push({ icon: 'plus', label: t('features.meals.newMeal'), onClick: () => setCreating(true) });
    }
    return actions;
  }, [canEdit, t, downloadPdf, downloadingPdf]);
  useRegisterTabActions(tabActions);

  const openMeal = meals.find((m) => m.id === openMealId) || null;
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  const renderMealCard = (meal: Meal) => (
    <MealCalendarCard
      item={meal}
      recipes={meal.recipe_ids.map((id) => recipeById.get(id)).filter((r): r is RecipeOption => !!r)}
      onSelect={() => setOpenMealId(meal.id)}
      onViewRecipe={viewRecipe}
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
        onRangeChange={handleRangeChange}
      />

      {creating && (
        <CreateMealModal
          featureInstanceId={featureInstanceId}
          defaultDate={selectedDate}
          persons={persons}
          recipes={recipes}
          onClose={() => setCreating(false)}
          onCreate={async (data, recipeIds, participantIds) => {
            const created = await createMeal(data);
            if (!created) return;
            for (const recipeId of recipeIds) {
              await toggleRecipe(created.id, recipeId);
            }
            if (participantIds.length > 0) {
              await setParticipants(created.id, participantIds);
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
          onViewRecipe={viewRecipe}
          onArchive={() => archiveMeal(openMeal.id)}
          onClose={() => setOpenMealId(null)}
        />
      )}
    </div>
  );
};

export default MealsTab;
