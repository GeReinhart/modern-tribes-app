import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Recipe, RecipeLabel } from './types.ts';

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
          <div style={{ fontWeight: 600 }}>{recipe.name}</div>
          <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.servingsCount', { count: recipe.servings })}
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
