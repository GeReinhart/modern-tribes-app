import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongLabelChips } from './SongLabelChips.tsx';
import { GuitarSong, GuitarSongLabel } from './types.ts';

interface SongCardProps {
  song: GuitarSong;
  labels: GuitarSongLabel[];
  onOpen: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, labels, onOpen }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedCard bordered className="flex flex-col gap-2 p-4" onClick={onOpen}>
      <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.text }}>{song.title}</div>
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
