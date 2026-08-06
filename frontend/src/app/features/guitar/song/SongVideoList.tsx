import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongVideoRow } from './SongVideoRow.tsx';
import { GuitarSongVideo, GuitarSongVideoCreate, GuitarSongVideoUpdate, MoveDirection } from './types.ts';

interface SongVideoListProps {
  videos: GuitarSongVideo[];
  canEdit: boolean;
  canManage: boolean;
  onAdd: (data: GuitarSongVideoCreate) => Promise<void>;
  onUpdate: (videoId: string, data: GuitarSongVideoUpdate) => Promise<void>;
  onMove: (videoId: string, direction: MoveDirection) => Promise<void>;
  onRemove: (videoId: string) => Promise<void>;
}

const isValidVideoUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');

export const SongVideoList: React.FC<SongVideoListProps> = ({
  videos, canEdit, canManage, onAdd, onUpdate, onMove, onRemove,
}) => {
  const { t } = useTranslation();
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!isValidVideoUrl(newUrl)) return;
    setAdding(true);
    try {
      await onAdd({ title: newTitle.trim() || null, url: newUrl.trim() });
      setNewUrl('');
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {videos.map((video, index) => (
        <SongVideoRow
          key={video.id}
          video={video}
          isFirst={index === 0}
          isLast={index === videos.length - 1}
          canEdit={canEdit}
          canManage={canManage}
          onUpdate={(data) => onUpdate(video.id, data)}
          onMove={(direction) => onMove(video.id, direction)}
          onRemove={() => onRemove(video.id)}
        />
      ))}
      {canEdit && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <ThemedInput
            label={t('guitarSong.videos.titlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <ThemedInput
            label={t('guitarSong.videos.urlLabel')}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ minWidth: '260px' }}
          />
          <ThemedButton onClick={handleAdd} disabled={!isValidVideoUrl(newUrl)} isLoading={adding} fullWidth={false}>
            {t('guitarSong.videos.add')}
          </ThemedButton>
        </div>
      )}
    </div>
  );
};
