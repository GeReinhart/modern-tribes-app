import { DIFFICULTY_LEVEL_STYLES } from '@/app/platform/core/layout/themes/components/difficultyLevelStyles.ts';
import { LevelBadge } from '@/app/platform/core/layout/themes/components/LevelBadge.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { formatDurationMinutes } from './durationFormat.ts';
import { RecipeDifficultyPicker } from './RecipeDifficultyPicker.tsx';
import { RecipeUpdate } from './types.ts';

interface Props {
  difficulty: number | null;
  prepTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  canEdit: boolean;
  onUpdate: (data: RecipeUpdate) => Promise<void>;
}

function parseMinutesInput(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : undefined;
}

// Difficulty (same 0-5 rating pattern as guitar songs) plus prep/total time, both edit-screen-only
// like difficulty, shown as a compact read-only line when there's nothing to edit.
const RecipeMetaSection: React.FC<Props> = ({ difficulty, prepTimeMinutes, totalTimeMinutes, canEdit, onUpdate }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!canEdit) {
    if (difficulty == null && prepTimeMinutes == null && totalTimeMinutes == null) return null;
    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {difficulty != null && (
          <LevelBadge
            styles={DIFFICULTY_LEVEL_STYLES} labelKeyPrefix="features.recipes.difficulty.level" value={difficulty}
          />
        )}
        {prepTimeMinutes != null && (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.prepTimeValue', { time: formatDurationMinutes(prepTimeMinutes, t) })}
          </span>
        )}
        {totalTimeMinutes != null && (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.totalTimeValue', { time: formatDurationMinutes(totalTimeMinutes, t) })}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <div style={{ fontSize: 'var(--font-sm)', marginBottom: '6px' }}>{t('features.recipes.difficulty.label')}</div>
        <RecipeDifficultyPicker value={difficulty} onChange={(value) => onUpdate({ difficulty: value })} />
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <ThemedInput
          label={t('features.recipes.prepTime')}
          type="number"
          min={0}
          defaultValue={prepTimeMinutes ?? ''}
          onBlur={(e) => {
            const value = parseMinutesInput(e.target.value);
            if (value !== undefined) onUpdate({ prep_time_minutes: value });
          }}
        />
        <ThemedInput
          label={t('features.recipes.totalTime')}
          type="number"
          min={0}
          defaultValue={totalTimeMinutes ?? ''}
          onBlur={(e) => {
            const value = parseMinutesInput(e.target.value);
            if (value !== undefined) onUpdate({ total_time_minutes: value });
          }}
        />
      </div>
    </div>
  );
};

export default RecipeMetaSection;
