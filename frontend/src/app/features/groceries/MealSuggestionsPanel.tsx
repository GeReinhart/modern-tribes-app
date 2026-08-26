import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMealDate } from './formatMealDate.ts';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { MealSuggestion } from './types.ts';

interface Props {
  suggestions: MealSuggestion[];
  canEdit: boolean;
  onAddAll: (mealId: string) => Promise<void>;
}

function suggestionKey(s: MealSuggestion): string {
  return `${s.meal_id}-${s.recipe_id}`;
}

const MealSuggestionsPanel: React.FC<Props> = ({ suggestions, canEdit, onAddAll }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

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

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.groceries.mealSuggestionsTitle')}</div>
      {sortedSuggestions.map((s) => {
        const key = suggestionKey(s);
        const expanded = !collapsedKeys.has(key);
        return (
          <div key={key} style={{ marginBottom: '10px', opacity: s.added ? 0.5 : 1 }}>
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
              actions={canEdit && !s.added ? (
                <button
                  type="button"
                  onClick={() => onAddAll(s.meal_id)}
                  title={t('features.groceries.addAllSuggestion')}
                  aria-label={t('features.groceries.addAllSuggestion')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${theme.colors.border}`, background: 'transparent',
                    color: theme.colors.primary, cursor: 'pointer',
                  }}
                >
                  <ThemedSvgIcon name="plus" color="currentColor" size={16} />
                </button>
              ) : undefined}
            />
            {expanded && (
              <div style={{ paddingLeft: '18px' }}>
                {s.ingredients.map((ingredient, index) => (
                  <div key={index} style={{ padding: '2px 0' }}>
                    {ingredient.name}
                    {ingredient.unit ? ` — ${ingredient.quantity} ${ingredient.unit}` : ` — ${ingredient.quantity}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MealSuggestionsPanel;
