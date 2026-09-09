import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Meal, RecipeOption } from './types.ts';

interface Props {
  item: Meal;
  recipes: RecipeOption[];
  onSelect: () => void;
  onViewRecipe: (recipeId: string) => void;
}

// Meals stack per day (see MealsWeekGrid) rather than sitting in an hourly
// grid, so this card just flows at its natural height — no time range, and
// no title line at all when there's no title.
const MealCalendarCard: React.FC<Props> = ({ item, recipes, onSelect, onViewRecipe }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      onClick={onSelect}
      style={{
        width: '100%', boxSizing: 'border-box', cursor: 'pointer',
        backgroundColor: theme.colors.surface,
        borderLeft: `4px solid ${theme.colors.primary}`,
        borderTop: `1px solid ${theme.colors.primary}33`,
        borderRight: `1px solid ${theme.colors.primary}33`,
        borderBottom: `1px solid ${theme.colors.primary}33`,
        borderRadius: '0 4px 4px 0',
        padding: '3px 6px',
        display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'normal',
      }}
    >
      {item.title && (
        <span style={{ fontSize: '13px', fontWeight: 800, color: theme.colors.text, lineHeight: 1.3 }}>
          {item.title}
        </span>
      )}
      {recipes.length > 0 && (
        <span style={{ fontSize: '13px', lineHeight: 1.3 }}>
          {recipes.map((recipe, index) => (
            <React.Fragment key={recipe.id}>
              {index > 0 && ', '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRecipe(recipe.id);
                }}
                style={{
                  border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                  font: 'inherit', fontWeight: 800, color: theme.colors.text, textDecoration: 'underline',
                  userSelect: 'none', position: 'relative', zIndex: 1,
                }}
              >
                {recipe.name}
              </button>
            </React.Fragment>
          ))}
        </span>
      )}
      <span style={{ fontSize: '11px', color: theme.colors.secondary, fontWeight: 600 }}>
        {t('features.meals.headcountShort', { count: item.headcount })}
      </span>
    </div>
  );
};

export default MealCalendarCard;
