import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongVideoPlayer } from './SongVideoPlayer.tsx';
import { GuitarSongVideo, GuitarSongVideoUpdate, MoveDirection } from './types.ts';

interface SongVideoRowProps {
  video: GuitarSongVideo;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  canManage: boolean;
  onUpdate: (data: GuitarSongVideoUpdate) => Promise<void>;
  onMove: (direction: MoveDirection) => Promise<void>;
  onRemove: () => Promise<void>;
}

export const SongVideoRow: React.FC<SongVideoRowProps> = ({
  video, isFirst, isLast, canEdit, canManage, onUpdate, onMove, onRemove,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(video.title ?? '');
  const [url, setUrl] = useState(video.url);

  const saveTitle = () => {
    if (title !== (video.title ?? '')) onUpdate({ title: title.trim() || null });
  };
  const saveUrl = () => {
    if (url.trim() && url !== video.url) onUpdate({ url: url.trim() });
  };

  if (!canEdit) {
    return <SongVideoPlayer video={video} />;
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {canManage && (
        <div style={{ display: 'flex', gap: '2px' }}>
          <ThemedIconButton
            action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: () => onMove('prev'), disabled: isFirst }}
          />
          <ThemedIconButton
            action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: () => onMove('next'), disabled: isLast }}
          />
          <ThemedIconButton
            action={{ icon: 'trash', label: t('guitarSong.videos.remove'), onClick: onRemove, variant: 'danger' }}
          />
        </div>
      )}
      <ThemedInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        placeholder={t('guitarSong.videos.titlePlaceholder')}
        style={{ maxWidth: '220px' }}
      />
      <ThemedInput value={url} onChange={(e) => setUrl(e.target.value)} onBlur={saveUrl} style={{ minWidth: '260px', flex: 1 }} />
    </div>
  );
};
