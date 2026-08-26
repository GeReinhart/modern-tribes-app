import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeIngredient } from './types.ts';

interface Props {
  ingredients: RecipeIngredient[];
  canEdit: boolean;
  onAdd: () => void;
  onRemove: (ingredientId: string) => void;
}

const RecipeIngredientsList: React.FC<Props> = ({ ingredients, canEdit, onAdd, onRemove }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.ingredients')}</div>
      {ingredients.length === 0 && (
        <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('features.recipes.noIngredients')}
        </div>
      )}
      {canEdit ? (
        ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <span>
              {ingredient.name}
              {ingredient.unit ? ` — ${ingredient.quantity} ${ingredient.unit}` : ` — ${ingredient.quantity}`}
            </span>
            <button
              type="button"
              onClick={() => onRemove(ingredient.id)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
            >
              <ThemedSvgIcon name="x" color="currentColor" size={16} />
            </button>
          </div>
        ))
      ) : (
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {ingredients.map((ingredient) => (
            <li key={ingredient.id} style={{ padding: '2px 0' }}>
              {ingredient.name}
              {ingredient.unit ? ` — ${ingredient.quantity} ${ingredient.unit}` : ` — ${ingredient.quantity}`}
            </li>
          ))}
        </ul>
      )}
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
