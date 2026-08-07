import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableText } from './SongInlineEditableField.tsx';
import { TITLE_HEADING_SIZES_PX } from './layoutBlockOptions.ts';
import { GuitarSongLayoutBlock } from './types.ts';

interface SongEditableBlockTitleProps {
  block: GuitarSongLayoutBlock;
  defaultTitle: string;
  canEdit: boolean;
  onSave: (customTitle: string | null) => Promise<void>;
}

// null custom_title means "use the block type's default label"; '' means the title was
// explicitly removed and nothing should render at all -- both distinct from an actual custom
// string, so callers must not conflate a cleared title with never having set one.
export const SongEditableBlockTitle: React.FC<SongEditableBlockTitleProps> = ({ block, defaultTitle, canEdit, onSave }) => {
  const { t } = useTranslation();
  const title = block.custom_title ?? defaultTitle;

  if (!canEdit) {
    return title ? (
      <ThemedText as={block.title_heading_level} style={{ fontSize: `${TITLE_HEADING_SIZES_PX[block.title_heading_level]}px` }}>
        {title}
      </ThemedText>
    ) : null;
  }

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <SongInlineEditableText value={title} maxLength={255} onSave={(value) => onSave(value)} />
      {title && (
        <ThemedIconButton
          action={{ icon: 'x', label: t('guitarSong.layout.removeBlockTitle'), onClick: () => onSave(''), variant: 'danger' }}
        />
      )}
    </div>
  );
};
