import { DIFFICULTY_LEVEL_STYLES } from '@/app/platform/core/layout/themes/components/difficultyLevelStyles.ts';
import { LevelBadge } from '@/app/platform/core/layout/themes/components/LevelBadge.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { formatDurationMinutes } from './durationFormat.ts';
import { Recipe, RecipeLabel, RecipeState } from './types.ts';

interface Props {
  recipe: Recipe;
  labels: RecipeLabel[];
  onOpen: () => void;
}

const RecipeRow: React.FC<Props> = ({ recipe, labels, onOpen }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const recipeLabels = labels.filter((l) => recipe.label_ids.includes(l.id));

  return (
    <ThemedCard onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>{recipe.name}</span>
            {recipe.recipe_state === RecipeState.draft && (
              <ThemedBadge variant="secondary">{t('features.recipes.state.draft')}</ThemedBadge>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
              {t('features.recipes.servingsCount', { count: recipe.servings })}
            </span>
            {recipe.difficulty != null && (
              <LevelBadge
                styles={DIFFICULTY_LEVEL_STYLES} labelKeyPrefix="features.recipes.difficulty.level"
                value={recipe.difficulty} size="sm"
              />
            )}
            {recipe.total_time_minutes != null && (
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                {t('features.recipes.totalTimeValue', { time: formatDurationMinutes(recipe.total_time_minutes, t) })}
              </span>
            )}
          </div>
        </div>
        {recipeLabels.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {recipeLabels.map((l) => (
              <span
                key={l.id}
                style={{
                  backgroundColor: l.color,
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: 'var(--font-xs)',
                }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </ThemedCard>
  );
};

export default RecipeRow;
