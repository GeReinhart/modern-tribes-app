import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GroceriesListItemCreate, MealSuggestion } from './types.ts';

interface Props {
  suggestions: MealSuggestion[];
  canEdit: boolean;
  onAdd: (data: GroceriesListItemCreate) => Promise<string | null>;
}

const MealSuggestionsPanel: React.FC<Props> = ({ suggestions, canEdit, onAdd }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (suggestions.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.groceries.mealSuggestionsTitle')}</div>
      {suggestions.map((s) => (
        <ThemedCard key={`${s.meal_id}-${s.recipe_id}`}>
          <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '6px' }}>
            {t('features.groceries.mealSuggestionSubtitle', {
              recipe: s.recipe_name, meal: s.meal_title, count: s.headcount,
            })}
          </div>
          {s.ingredients.map((ingredient, index) => (
            <div
              key={index}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}
            >
              <span>
                {ingredient.name}
                {ingredient.unit ? ` — ${ingredient.quantity} ${ingredient.unit}` : ` — ${ingredient.quantity}`}
              </span>
              {canEdit && (
                <ThemedButton
                  variant="ghost"
                  onClick={() =>
                    onAdd(
                      ingredient.groceries_item_id
                        ? { groceries_item_id: ingredient.groceries_item_id, quantity: ingredient.quantity }
                        : { custom_name: ingredient.name, custom_unit: ingredient.unit ?? undefined, quantity: ingredient.quantity },
                    )
                  }
                >
                  {t('features.groceries.addSuggestion')}
                </ThemedButton>
              )}
            </div>
          ))}
        </ThemedCard>
      ))}
    </div>
  );
};

export default MealSuggestionsPanel;
