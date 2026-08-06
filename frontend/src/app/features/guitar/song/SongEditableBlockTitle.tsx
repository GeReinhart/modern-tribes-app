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
  // When set, the editable field starts empty and shows this as a hint instead of prefilling
  // defaultTitle as actual text -- used where an auto-generated label (e.g. "Sections") would be
  // confusing to edit around, unlike the other block types that still want it as a real fallback.
  placeholder?: string;
}

// null custom_title means "use the block type's default label"; '' means the title was
// explicitly removed and nothing should render at all -- both distinct from an actual custom
// string, so callers must not conflate a cleared title with never having set one.
export const SongEditableBlockTitle: React.FC<SongEditableBlockTitleProps> = ({ block, defaultTitle, canEdit, onSave, placeholder }) => {
  const { t } = useTranslation();
  const title = block.custom_title ?? defaultTitle;
  // H5 is a deliberately toned-down heading level any block type can pick (not tied to any one
  // block type) -- non-bold and italic, unlike H1-H4. 'sections' ("Lyrics & Chords") blocks
  // default to it (see layoutDraft.ts's emptyDraftBlock).
  const isH5 = block.title_heading_level === 'h5';
  const titleStyle: React.CSSProperties = {
    fontSize: `${TITLE_HEADING_SIZES_PX[block.title_heading_level]}px`,
    ...(isH5 ? { fontWeight: 400, fontStyle: 'italic' } : {}),
  };

  if (!canEdit) {
    return title ? (
      <ThemedText as={block.title_heading_level} style={titleStyle}>
        {title}
      </ThemedText>
    ) : null;
  }

  const editValue = placeholder ? (block.custom_title ?? '') : title;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <SongInlineEditableText
        value={editValue} maxLength={255} placeholder={placeholder} onSave={(value) => onSave(value)}
        style={isH5 ? { fontStyle: 'italic' } : undefined}
      />
      {editValue && (
        <ThemedIconButton
          action={{ icon: 'x', label: t('guitarSong.layout.removeBlockTitle'), onClick: () => onSave(''), variant: 'danger' }}
        />
      )}
    </div>
  );
};
