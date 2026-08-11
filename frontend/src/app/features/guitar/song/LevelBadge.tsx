import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { DIFFICULTY_LEVEL_STYLES } from '../chords/difficultyLevels.ts';

interface LevelBadgeProps {
  styles: typeof DIFFICULTY_LEVEL_STYLES;
  labelKeyPrefix: string;
  value: number;
  size?: 'sm' | 'lg';
}

const ICON_SIZE = { sm: 14, lg: 24 };
const FONT_SIZE = { sm: '11px', lg: '16px' };

// A single level's icon+color+caption, read-only -- for showing just the selected value instead
// of the full picker row (SongCard's compact "sm", or a read-only band's more prominent "lg").
export const LevelBadge: React.FC<LevelBadgeProps> = ({ styles, labelKeyPrefix, value, size = 'sm' }) => {
  const { t } = useTranslation();
  const style = styles[value];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <ThemedSvgIcon name={style.icon} color={style.color} size={ICON_SIZE[size]} />
      <span style={{ fontSize: FONT_SIZE[size], fontWeight: 600, color: style.color }}>{t(`${labelKeyPrefix}${value}`)}</span>
    </div>
  );
};
