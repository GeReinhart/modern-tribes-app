import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { CatalogItemOption, RecipeState } from './types.ts';

interface Props {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  catalogItems: CatalogItemOption[];
  ingredientId: string;
  onIngredientChange: (value: string) => void;
  selectedStates: RecipeState[];
  onToggleState: (state: RecipeState) => void;
}

const STATE_OPTIONS: Array<{ value: RecipeState; labelKey: string }> = [
  { value: RecipeState.draft, labelKey: 'features.recipes.state.draft' },
  { value: RecipeState.completed, labelKey: 'features.recipes.state.completed' },
];

const RecipeSearchFilters: React.FC<Props> = ({
  searchInput, onSearchInputChange, catalogItems, ingredientId, onIngredientChange, selectedStates, onToggleState,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const ingredientOptions: SelectOption[] = catalogItems.map((i) => ({ value: i.id, label: i.name }));

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: 'var(--font-xxs)',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
    backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.surface,
    color: active ? theme.colors.primary : theme.colors.secondary,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <ThemedInput
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        placeholder={t('features.recipes.searchPlaceholder')}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ minWidth: '220px' }}>
          <ThemedSelect
            options={ingredientOptions}
            value={ingredientId}
            placeholder={t('features.recipes.ingredientFilterPlaceholder')}
            onChange={onIngredientChange}
          />
        </div>
        {STATE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            style={chipStyle(selectedStates.includes(option.value))}
            onClick={() => onToggleState(option.value)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecipeSearchFilters;
