import { ThemedLevelPicker } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { DIFFICULTY_LEVEL_STYLES } from './difficultyLevels.ts';

interface ChordDifficultyPickerProps {
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const ChordDifficultyPicker: React.FC<ChordDifficultyPickerProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const options = DIFFICULTY_LEVEL_STYLES.map((style) => ({
    ...style, caption: t(`guitarChords.difficulty.level${style.value}`),
  }));

  return (
    <ThemedLevelPicker
      options={options}
      value={value ?? null}
      onChange={onChange}
      ariaLabelPrefix={t('guitarChords.difficulty.label')}
      disabled={disabled}
    />
  );
};
