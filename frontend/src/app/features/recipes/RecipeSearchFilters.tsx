import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { DIFFICULTY_LEVEL_STYLES } from '@/app/platform/core/layout/themes/components/difficultyLevelStyles.ts';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
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
  selectedDifficulties: number[];
  onToggleDifficulty: (value: number) => void;
  onClearDifficulty: () => void;
}

const STATE_OPTIONS: Array<{ value: RecipeState; labelKey: string }> = [
  { value: RecipeState.draft, labelKey: 'features.recipes.state.draft' },
  { value: RecipeState.completed, labelKey: 'features.recipes.state.completed' },
];

const RecipeSearchFilters: React.FC<Props> = ({
  searchInput, onSearchInputChange, catalogItems, ingredientId, onIngredientChange,
  selectedStates, onToggleState, selectedDifficulties, onToggleDifficulty, onClearDifficulty,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const ingredientOptions: SelectOption[] = catalogItems.map((i) => ({ value: i.id, label: i.name }));

  const chipStyle = (active: boolean, color = theme.colors.primary): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: 'var(--font-xxs)',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? color : theme.colors.border}`,
    backgroundColor: active ? `${color}15` : theme.colors.surface,
    color: active ? color : theme.colors.secondary,
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, fontWeight: 600 }}>
          {t('features.recipes.difficulty.label')}
        </span>
        {DIFFICULTY_LEVEL_STYLES.map((style) => {
          const active = selectedDifficulties.includes(style.value);
          return (
            <button
              key={style.value}
              type="button"
              style={chipStyle(active, style.color)}
              onClick={() => onToggleDifficulty(style.value)}
            >
              <ThemedSvgIcon name={style.icon} color={active ? style.color : theme.colors.secondary} size={11} />
              {t(`features.recipes.difficulty.level${style.value}`)}
            </button>
          );
        })}
        {selectedDifficulties.length > 0 && (
          <button type="button" style={chipStyle(false)} onClick={onClearDifficulty}>
            {t('features.recipes.clearDifficultyFilter')}
          </button>
        )}
      </div>
    </div>
  );
};

export default RecipeSearchFilters;
