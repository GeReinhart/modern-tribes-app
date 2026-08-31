import { formatQuantityUnit, translateUnit } from '@/app/platform/core/formatQuantity.ts';
import { ThemedQuantityStepper } from '@/app/platform/core/layout/themes/components/ThemedQuantityStepper.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeIngredient, RecipeIngredientUpdate } from './types.ts';

interface Props {
  ingredient: RecipeIngredient;
  canEdit: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (ingredientId: string, direction: 'up' | 'down') => void;
  onUpdateIngredient: (ingredientId: string, data: RecipeIngredientUpdate) => void;
  onRemove: (ingredientId: string) => void;
}

const RecipeIngredientRow: React.FC<Props> = ({
  ingredient, canEdit, canMoveUp, canMoveDown, onMove, onUpdateIngredient, onRemove,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [displayOverride, setDisplayOverride] = useState(ingredient.display_override ?? '');
  const moveButtonStyle = (enabled: boolean): React.CSSProperties => ({
    border: 'none', background: 'transparent', display: 'flex',
    cursor: enabled ? 'pointer' : 'default', color: theme.colors.secondary, opacity: enabled ? 1 : 0.3,
  });

  if (!canEdit) {
    const quantityLabel = ingredient.display_override
      || formatQuantityUnit(ingredient.quantity, ingredient.unit, ingredient.is_divisible, t);
    return <li style={{ padding: '2px 0' }}>{`${ingredient.name} — ${quantityLabel}`}</li>;
  }

  const commitDisplayOverride = () => {
    const trimmed = displayOverride.trim();
    if (trimmed !== (ingredient.display_override ?? '')) {
      onUpdateIngredient(ingredient.id, { display_override: trimmed || null });
    }
  };

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
          onChange={(value) => onUpdateIngredient(ingredient.id, { quantity: value })}
        />
        {ingredient.unit && ingredient.unit !== 'piece' && (
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>
            {translateUnit(ingredient.unit, t, ingredient.quantity)}
          </span>
        )}
        <input
          type="text"
          value={displayOverride}
          onChange={(e) => setDisplayOverride(e.target.value)}
          onBlur={commitDisplayOverride}
          placeholder={t('features.recipes.displayOverridePlaceholder')}
          title={t('features.recipes.displayOverride')}
          style={{
            width: '110px', padding: '3px 6px', fontSize: 'var(--font-xs)',
            border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-sm)',
            backgroundColor: theme.colors.surface, color: theme.colors.text,
          }}
        />
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
