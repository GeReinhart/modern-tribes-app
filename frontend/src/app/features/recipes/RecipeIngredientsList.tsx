import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import RecipeIngredientRow from './RecipeIngredientRow.tsx';
import { RecipeIngredient } from './types.ts';

interface Props {
  ingredients: RecipeIngredient[];
  canEdit: boolean;
  onAdd: () => void;
  onRemove: (ingredientId: string) => void;
}

interface GroupProps {
  title?: string;
  ingredients: RecipeIngredient[];
  canEdit: boolean;
  onRemove: (ingredientId: string) => void;
}

const IngredientGroup: React.FC<GroupProps> = ({ title, ingredients, canEdit, onRemove }) => {
  if (ingredients.length === 0) return null;
  const rows = ingredients.map((ingredient) => (
    <RecipeIngredientRow key={ingredient.id} ingredient={ingredient} canEdit={canEdit} onRemove={onRemove} />
  ));
  return (
    <div>
      {title && <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', margin: '10px 0 4px' }}>{title}</div>}
      {canEdit ? rows : <ul style={{ margin: 0, paddingLeft: '20px' }}>{rows}</ul>}
    </div>
  );
};

const RecipeIngredientsList: React.FC<Props> = ({ ingredients, canEdit, onAdd, onRemove }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const mainIngredients = ingredients.filter((i) => !i.is_accompaniment);
  const accompaniments = ingredients.filter((i) => i.is_accompaniment);

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.ingredients')}</div>
      {ingredients.length === 0 && (
        <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('features.recipes.noIngredients')}
        </div>
      )}
      <IngredientGroup ingredients={mainIngredients} canEdit={canEdit} onRemove={onRemove} />
      <IngredientGroup
        title={t('features.recipes.accompaniments')}
        ingredients={accompaniments}
        canEdit={canEdit}
        onRemove={onRemove}
      />
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
