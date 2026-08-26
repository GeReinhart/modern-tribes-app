import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { RecipeIngredient } from './types.ts';

interface Props {
  ingredient: RecipeIngredient;
  canEdit: boolean;
  onRemove: (ingredientId: string) => void;
}

const RecipeIngredientRow: React.FC<Props> = ({ ingredient, canEdit, onRemove }) => {
  const { theme } = useTheme();
  const label = ingredient.unit
    ? `${ingredient.name} — ${ingredient.quantity} ${ingredient.unit}`
    : `${ingredient.name} — ${ingredient.quantity}`;

  if (!canEdit) return <li style={{ padding: '2px 0' }}>{label}</li>;

  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onRemove(ingredient.id)}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
      >
        <ThemedSvgIcon name="x" color="currentColor" size={16} />
      </button>
    </div>
  );
};

export default RecipeIngredientRow;
