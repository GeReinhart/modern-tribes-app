import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { MAX_CUSTOM_CONTENT_SIZE_PX, MIN_CUSTOM_CONTENT_SIZE_PX } from './songLimits.ts';
import { GuitarSongLayoutBlock, GuitarSongLayoutBlockContentUpdate } from './types.ts';

interface SongFormCustomBlockCardProps {
  block: GuitarSongLayoutBlock;
  onUpdate: (data: GuitarSongLayoutBlockContentUpdate) => Promise<void>;
}

export const SongFormCustomBlockCard: React.FC<SongFormCustomBlockCardProps> = ({ block, onUpdate }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(block.custom_title ?? '');

  const saveTitle = () => {
    if (title !== (block.custom_title ?? '')) onUpdate({ custom_title: title });
  };

  return (
    <ThemedCard bordered className="p-3">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ThemedInput
          label={t('guitarSong.layout.customBlockTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          maxLength={255}
        />
        <SongInlineEditableNumber
          value={block.custom_content_size_px} min={MIN_CUSTOM_CONTENT_SIZE_PX} max={MAX_CUSTOM_CONTENT_SIZE_PX}
          ariaLabel={t('guitarSong.layout.customBlockContentSize')} label={t('guitarSong.layout.customBlockContentSize')}
          onSave={(custom_content_size_px) => onUpdate({ custom_content_size_px })}
          style={{ width: '110px' }}
        />
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <EditorJoditComponent
            content={block.custom_content_html ?? ''}
            onChange={(value) => onUpdate({ custom_content_html: value })}
            minHeight={150}
          />
        </div>
      </div>
    </ThemedCard>
  );
};
