import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { DIFFICULTY_LEVEL_STYLES } from '../chords/difficultyLevels.ts';
import { LevelBadge } from './LevelBadge.tsx';
import { MASTERY_LEVEL_STYLES } from './masteryLevels.ts';
import { SongLabelChips } from './SongLabelChips.tsx';
import { GuitarSong, GuitarSongLabel, GuitarSongState } from './types.ts';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.text }}>{song.title}</div>
        {song.song_state === GuitarSongState.draft && (
          <ThemedBadge variant="secondary">{t('guitarSong.state.draft')}</ThemedBadge>
        )}
      </div>
      {song.author && (
        <div style={{ fontSize: '13px', color: theme.colors.secondary }}>{song.author}</div>
      )}
      <div style={{ fontSize: '12px', color: theme.colors.text, opacity: 0.7 }}>
        {t('guitarSong.card.tempo', { bpm: song.tempo_bpm, beats: song.beats_per_bar })}
        {song.capo > 0 && ` · ${t('guitarSong.card.capo', { fret: song.capo })}`}
      </div>
      <div style={{ fontSize: '12px', color: theme.colors.text, opacity: 0.7 }}>
        {t('guitarSong.card.chordCount', { count: song.chord_count })}
        {song.difficult_chord_count > 0
          && ` · ${t('guitarSong.card.difficultChordCount', { count: song.difficult_chord_count })}`}
      </div>
      {song.difficulty != null && (
        <LevelBadge styles={DIFFICULTY_LEVEL_STYLES} labelKeyPrefix="guitarSong.difficulty.level" value={song.difficulty} />
      )}
      {song.my_mastery != null && (
        <LevelBadge styles={MASTERY_LEVEL_STYLES} labelKeyPrefix="guitarSong.mastery.level" value={song.my_mastery} />
      )}
      <SongLabelChips labels={labels} labelIds={song.label_ids} />
    </ThemedCard>
  );
};
