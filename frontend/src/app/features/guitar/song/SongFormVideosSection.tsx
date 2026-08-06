import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongVideoList } from './SongVideoList.tsx';
import { GuitarSongVideo, GuitarSongVideoCreate, GuitarSongVideoUpdate, MoveDirection } from './types.ts';

interface SongFormVideosSectionProps {
  videos: GuitarSongVideo[];
  canManage: boolean;
  onAdd: (data: GuitarSongVideoCreate) => Promise<void>;
  onUpdate: (videoId: string, data: GuitarSongVideoUpdate) => Promise<void>;
  onMove: (videoId: string, direction: MoveDirection) => Promise<void>;
  onRemove: (videoId: string) => Promise<void>;
}

export const SongFormVideosSection: React.FC<SongFormVideosSectionProps> = ({
  videos, canManage, onAdd, onUpdate, onMove, onRemove,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
        {t('guitarSong.videos.title')}
      </ThemedText>
      <SongVideoList
        videos={videos}
        canEdit
        canManage={canManage}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onMove={onMove}
        onRemove={onRemove}
      />
    </div>
  );
};
