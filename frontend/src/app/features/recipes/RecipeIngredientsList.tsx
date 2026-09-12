import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import IngredientGroupBlock from './IngredientGroupBlock.tsx';
import { buildIngredientDisplayGroups } from './ingredientOrdering.ts';
import { RecipeIngredient, RecipeIngredientUpdate } from './types.ts';

interface Props {
  ingredients: RecipeIngredient[];
  canEdit: boolean;
  onAdd: () => void;
  onMove: (ingredientId: string, direction: 'up' | 'down') => void;
  onUpdateIngredient: (ingredientId: string, data: RecipeIngredientUpdate) => void;
  onRemove: (ingredientId: string) => void;
}

const RecipeIngredientsList: React.FC<Props> = ({ ingredients, canEdit, onAdd, onMove, onUpdateIngredient, onRemove }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const groups = buildIngredientDisplayGroups(ingredients, canEdit, {
    condiments: t('features.recipes.condiments'),
    accompaniments: t('features.recipes.accompaniments'),
  });

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.ingredients')}</div>
      {ingredients.length === 0 && (
        <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('features.recipes.noIngredients')}
        </div>
      )}
      <div style={{ columnCount: 2, columnGap: '24px' }}>
        {groups.map((group, index) => (
          <IngredientGroupBlock
            key={group.title ?? `group-${index}`}
            title={group.title}
            ingredients={group.ingredients}
            canEdit={canEdit}
            onMove={onMove}
            onUpdateIngredient={onUpdateIngredient}
            onRemove={onRemove}
          />
        ))}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={onAdd}
          title={t('features.recipes.addIngredient')}
          aria-label={t('features.recipes.addIngredient')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', marginTop: '8px', borderRadius: 'var(--radius-md)',
            border: `1px solid ${theme.colors.border}`, background: 'transparent',
            color: theme.colors.primary, cursor: 'pointer',
          }}
        >
          <ThemedSvgIcon name="plus" color="currentColor" size={16} />
        </button>
      )}
    </div>
  );
};

export default RecipeIngredientsList;
