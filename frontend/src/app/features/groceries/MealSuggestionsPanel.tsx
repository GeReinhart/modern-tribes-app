import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatMealDate } from './formatMealDate.ts';
import { translateUnit } from '@/app/platform/core/formatQuantity.ts';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { MealSuggestion, MealSuggestionIngredient } from './types.ts';

interface Props {
  suggestions: MealSuggestion[];
  canEdit: boolean;
  onAddAll: (mealId: string) => Promise<void>;
  onRemoveAll: (mealId: string) => Promise<void>;
  onAddIngredient: (mealId: string, recipeIngredientId: string) => Promise<void>;
}

function suggestionKey(s: MealSuggestion): string {
  return `${s.meal_id}-${s.recipe_id}`;
}

function formatIngredientLabel(ingredient: MealSuggestionIngredient, t: TFunction): string {
  return ingredient.unit
    ? `${ingredient.name} — ${ingredient.quantity} ${translateUnit(ingredient.unit, t, ingredient.quantity)}`
    : `${ingredient.name} — ${ingredient.quantity}`;
}

const SuggestionIconButton: React.FC<{ onClick: () => void; label: string; icon: 'plus' | 'x'; danger?: boolean }> = ({
  onClick, label, icon, danger,
}) => {
  const { theme } = useTheme();
  const color = danger ? theme.colors.danger : theme.colors.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: 'var(--radius-md)',
        border: `1px solid ${theme.colors.border}`, background: 'transparent',
        color, cursor: 'pointer', flexShrink: 0,
      }}
    >
      <ThemedSvgIcon name={icon} color="currentColor" size={12} />
    </button>
  );
};

const MealSuggestionsPanel: React.FC<Props> = ({ suggestions, canEdit, onAddAll, onRemoveAll, onAddIngredient }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [removingMeal, setRemovingMeal] = useState<MealSuggestion | null>(null);
  const [removing, setRemoving] = useState(false);

  const sortedSuggestions = useMemo(
    () => [...suggestions].sort((a, b) => a.meal_start_at.localeCompare(b.meal_start_at)),
    [suggestions],
  );

  if (sortedSuggestions.length === 0) return null;

  const toggle = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleConfirmRemove = async () => {
    if (!removingMeal) return;
    setRemoving(true);
    await onRemoveAll(removingMeal.meal_id);
    setRemoving(false);
    setRemovingMeal(null);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.groceries.mealSuggestionsTitle')}</div>
      {sortedSuggestions.map((s) => {
        const key = suggestionKey(s);
        const expanded = !collapsedKeys.has(key);
        const mainIngredients = s.ingredients.filter((i) => !i.is_accompaniment);
        const accompaniments = s.ingredients.filter((i) => i.is_accompaniment);
        return (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ opacity: s.added ? 0.5 : 1 }}>
              <GroceriesSectionToggleHeader
                icon={null}
                name={t('features.groceries.mealSuggestionSubtitle', {
                  recipe: s.recipe_name,
                  meal: s.meal_title,
                  date: formatMealDate(s.meal_start_at, i18n.language),
                  count: s.headcount,
                })}
                count={s.ingredients.length}
                expanded={expanded}
                onToggle={() => toggle(key)}
                actionsAlign="start"
                actions={canEdit ? (
                  s.added ? (
                    <SuggestionIconButton
                      icon="x"
                      danger
                      onClick={() => setRemovingMeal(s)}
                      label={t('features.groceries.removeAddedMeal')}
                    />
                  ) : (
                    <SuggestionIconButton
                      icon="plus"
                      onClick={() => onAddAll(s.meal_id)}
                      label={t('features.groceries.addAllSuggestion')}
                    />
                  )
                ) : undefined}
              />
            </div>
            {expanded && (
              <div style={{ paddingLeft: '18px' }}>
                <div style={{ opacity: s.added ? 0.5 : 1 }}>
                  {mainIngredients.map((ingredient) => (
                    <div key={ingredient.recipe_ingredient_id} style={{ padding: '2px 0' }}>
                      {formatIngredientLabel(ingredient, t)}
                    </div>
                  ))}
                </div>
                {accompaniments.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
                      {t('features.groceries.accompaniments')}
                    </div>
                    {accompaniments.map((ingredient) => (
                      <div
                        key={ingredient.recipe_ingredient_id}
                        style={{ padding: '2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {canEdit && (
                          <SuggestionIconButton
                            icon="plus"
                            onClick={() => onAddIngredient(s.meal_id, ingredient.recipe_ingredient_id)}
                            label={t('features.groceries.addAccompanimentSuggestion')}
                          />
                        )}
                        {formatIngredientLabel(ingredient, t)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {removingMeal && (
        <ThemedConfirmDialog
          isOpen
          onClose={() => setRemovingMeal(null)}
          onConfirm={handleConfirmRemove}
          title={t('features.groceries.removeAddedMeal')}
          message={t('features.groceries.removeAddedMealConfirm', {
            recipe: removingMeal.recipe_name, date: formatMealDate(removingMeal.meal_start_at, i18n.language),
          })}
          variant="danger"
          isLoading={removing}
        />
      )}
    </div>
  );
};

export default MealSuggestionsPanel;
