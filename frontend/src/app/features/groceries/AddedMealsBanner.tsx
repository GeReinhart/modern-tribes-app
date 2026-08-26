import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMealDate } from './formatMealDate.ts';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { AddedMeal } from './types.ts';

interface Props {
  meals: AddedMeal[];
}

const AddedMealsBanner: React.FC<Props> = ({ meals }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);

  if (meals.length === 0) return null;

  return (
    <div style={{ marginBottom: '12px' }}>
      <GroceriesSectionToggleHeader
        icon={null}
        name={t('features.groceries.mealsAccountedFor')}
        count={meals.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {expanded && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {meals.map((meal) => (
          <div
            key={meal.meal_id}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              fontSize: 'var(--font-xs)',
              color: theme.colors.text,
            }}
          >
            {meal.meal_title && (
              <>
                <span style={{ fontWeight: 600 }}>{meal.meal_title}</span>
                {' — '}
              </>
            )}
            {formatMealDate(meal.meal_start_at, i18n.language)}
            {' — '}
            {t('features.groceries.mealAccountedForHeadcount', { count: meal.headcount })}
            {meal.recipe_names.length > 0 && (
              <>
                {' — '}
                <span style={{ color: theme.colors.secondary }}>{meal.recipe_names.join(', ')}</span>
              </>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default AddedMealsBanner;
