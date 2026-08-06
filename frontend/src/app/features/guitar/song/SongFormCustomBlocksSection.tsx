import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongFormCustomBlockCard } from './SongFormCustomBlockCard.tsx';
import { GuitarSongLayout, GuitarSongLayoutBlock, GuitarSongLayoutBlockContentUpdate } from './types.ts';

interface SongFormCustomBlocksSectionProps {
  layout: GuitarSongLayout;
  onUpdateBlock: (blockId: string, data: GuitarSongLayoutBlockContentUpdate) => Promise<void>;
}

const customBlocksFromLayout = (layout: GuitarSongLayout): GuitarSongLayoutBlock[] =>
  layout.rows
    .flatMap((row) => row.columns)
    .flatMap((column) => column.blocks)
    .filter((block) => block.block_type === 'custom');

export const SongFormCustomBlocksSection: React.FC<SongFormCustomBlocksSectionProps> = ({ layout, onUpdateBlock }) => {
  const { t } = useTranslation();
  const blocks = customBlocksFromLayout(layout);

  if (blocks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ThemedText size="medium" as="h3">{t('guitarSong.layout.customBlocksTitle')}</ThemedText>
      {blocks.map((block) => (
        <SongFormCustomBlockCard key={block.id} block={block} onUpdate={(data) => onUpdateBlock(block.id, data)} />
      ))}
    </div>
  );
};
