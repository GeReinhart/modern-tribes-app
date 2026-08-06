import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongLabelChips } from './SongLabelChips.tsx';
import { GuitarSong, GuitarSongLabel } from './types.ts';

interface SongCardProps {
  song: GuitarSong;
  labels: GuitarSongLabel[];
  canDuplicate: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, labels, canDuplicate, onOpen, onDuplicate }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedCard bordered className="flex flex-col gap-2 p-4" onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.text }}>{song.title}</div>
        {canDuplicate && (
          <div onClick={(e) => e.stopPropagation()}>
            <ThemedIconButton
              action={{ icon: 'copy', label: t('guitarSong.list.duplicate'), onClick: onDuplicate }}
            />
          </div>
        )}
      </div>
      {song.author && (
        <div style={{ fontSize: '13px', color: theme.colors.secondary }}>{song.author}</div>
      )}
      <div style={{ fontSize: '12px', color: theme.colors.text, opacity: 0.7 }}>
        {t('guitarSong.card.tempo', { bpm: song.tempo_bpm, beats: song.beats_per_bar })}
        {song.capo > 0 && ` · ${t('guitarSong.card.capo', { fret: song.capo })}`}
      </div>
      <SongLabelChips labels={labels} labelIds={song.label_ids} />
    </ThemedCard>
  );
};
