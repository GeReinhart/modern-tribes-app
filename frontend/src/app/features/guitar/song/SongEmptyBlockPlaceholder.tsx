import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { blockTypeLabel } from './layoutBlockOptions.ts';
import { LayoutBlockType } from './types.ts';

interface SongEmptyBlockPlaceholderProps {
  blockType: LayoutBlockType;
}

// In edit mode a block with no content yet can't just disappear the way it does in presentation
// mode (returning null there is correct -- there's nothing to print) -- it still needs to stay
// visible and selectable so its "Modifier" menu action can be reached at all.
export const SongEmptyBlockPlaceholder: React.FC<SongEmptyBlockPlaceholderProps> = ({ blockType }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        border: `1px dashed ${theme.colors.border}`, borderRadius: 'var(--radius-md)',
        padding: '16px', color: theme.colors.secondary, fontSize: '13px', textAlign: 'center',
      }}
    >
      {t('guitarSong.layout.emptyBlock', { type: blockTypeLabel(t, blockType) })}
    </div>
  );
};
