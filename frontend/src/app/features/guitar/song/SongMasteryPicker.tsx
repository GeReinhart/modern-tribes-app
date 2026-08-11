import { ThemedLevelPicker } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { MASTERY_LEVEL_STYLES } from './masteryLevels.ts';

interface SongMasteryPickerProps {
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const SongMasteryPicker: React.FC<SongMasteryPickerProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const options = MASTERY_LEVEL_STYLES.map((style) => ({
    ...style, caption: t(`guitarSong.mastery.level${style.value}`),
  }));

  return (
    <ThemedLevelPicker
      options={options}
      value={value ?? null}
      onChange={onChange}
      ariaLabelPrefix={t('guitarSong.mastery.label')}
      disabled={disabled}
    />
  );
};
