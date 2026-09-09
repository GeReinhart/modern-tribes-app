import { DIFFICULTY_LEVEL_STYLES } from '@/app/platform/core/layout/themes/components/difficultyLevelStyles.ts';
import { ThemedLevelPicker } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const RecipeDifficultyPicker: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const options = DIFFICULTY_LEVEL_STYLES.map((style) => ({
    ...style, caption: t(`features.recipes.difficulty.level${style.value}`),
  }));

  return (
    <ThemedLevelPicker
      options={options}
      value={value ?? null}
      onChange={onChange}
      ariaLabelPrefix={t('features.recipes.difficulty.label')}
      disabled={disabled}
    />
  );
};
