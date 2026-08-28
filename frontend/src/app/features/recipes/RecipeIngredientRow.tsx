import { ThemedQuantityStepper } from '@/app/platform/core/layout/themes/components/ThemedQuantityStepper.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeIngredient } from './types.ts';

interface Props {
  ingredient: RecipeIngredient;
  canEdit: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (ingredientId: string, direction: 'up' | 'down') => void;
  onUpdateQuantity: (ingredientId: string, quantity: number) => void;
  onRemove: (ingredientId: string) => void;
}

const RecipeIngredientRow: React.FC<Props> = ({
  ingredient, canEdit, canMoveUp, canMoveDown, onMove, onUpdateQuantity, onRemove,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const moveButtonStyle = (enabled: boolean): React.CSSProperties => ({
    border: 'none', background: 'transparent', display: 'flex',
    cursor: enabled ? 'pointer' : 'default', color: theme.colors.secondary, opacity: enabled ? 1 : 0.3,
  });

  if (!canEdit) {
    const readOnlyLabel = ingredient.unit
      ? `${ingredient.name} — ${ingredient.quantity} ${ingredient.unit}`
      : `${ingredient.name} — ${ingredient.quantity}`;
    return <li style={{ padding: '2px 0' }}>{readOnlyLabel}</li>;
  }

  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <span>{ingredient.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ThemedQuantityStepper
          value={ingredient.quantity}
          isDivisible={ingredient.is_divisible}
          canEdit={canEdit}
          onChange={(value) => onUpdateQuantity(ingredient.id, value)}
        />
        {ingredient.unit && (
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>{ingredient.unit}</span>
        )}
        <button
          type="button"
          onClick={() => onMove(ingredient.id, 'up')}
          disabled={!canMoveUp}
          title={t('features.recipes.moveIngredientUp')}
          style={moveButtonStyle(canMoveUp)}
        >
          <ThemedSvgIcon name="arrow-up" color="currentColor" size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(ingredient.id, 'down')}
          disabled={!canMoveDown}
          title={t('features.recipes.moveIngredientDown')}
          style={moveButtonStyle(canMoveDown)}
        >
          <ThemedSvgIcon name="arrow-down" color="currentColor" size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(ingredient.id)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
        >
          <ThemedSvgIcon name="x" color="currentColor" size={16} />
        </button>
      </div>
    </div>
  );
};

export default RecipeIngredientRow;
