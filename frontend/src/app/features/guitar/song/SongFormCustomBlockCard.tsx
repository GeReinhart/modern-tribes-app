import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <EditorJoditComponent
            content={block.custom_content_html ?? ''}
            onChange={(value) => onUpdate({ custom_content_html: value })}
            compact
            minHeight={150}
          />
        </div>
      </div>
    </ThemedCard>
  );
};
