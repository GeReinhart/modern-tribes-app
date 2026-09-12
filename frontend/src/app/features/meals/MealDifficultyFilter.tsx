import { DIFFICULTY_LEVEL_STYLES } from '@/app/platform/core/layout/themes/components/difficultyLevelStyles.ts';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  selectedDifficulties: number[];
  onToggle: (value: number) => void;
  onClear: () => void;
}

// Filters meals by whether any of their linked recipes has the selected difficulty — a meal has
// no difficulty of its own, so this reuses the recipe difficulty scale/labels for consistency.
const MealDifficultyFilter: React.FC<Props> = ({ selectedDifficulties, onToggle, onClear }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, fontWeight: 600 }}>
        {t('features.meals.filterByDifficulty')}
      </span>
      {DIFFICULTY_LEVEL_STYLES.map((style) => {
        const active = selectedDifficulties.includes(style.value);
        return (
          <button
            key={style.value}
            type="button"
            style={chipStyle(active, style.color)}
            onClick={() => onToggle(style.value)}
          >
            <ThemedSvgIcon name={style.icon} color={active ? style.color : theme.colors.secondary} size={11} />
            {t(`features.recipes.difficulty.level${style.value}`)}
          </button>
        );
      })}
      {selectedDifficulties.length > 0 && (
        <button type="button" style={chipStyle(false, theme.colors.secondary)} onClick={onClear}>
          {t('features.meals.clearDifficultyFilter')}
        </button>
      )}
    </div>
  );
};

export default MealDifficultyFilter;
