import React from 'react';
import { useTranslation } from 'react-i18next';

import { DIFFICULTY_LEVEL_STYLES } from '../chords/difficultyLevels.ts';
import { LevelBadge } from './LevelBadge.tsx';
import { SongDifficultyPicker } from './SongDifficultyPicker.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongDifficultyBandProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  canEdit: boolean;
}

// The song's own difficulty is editable only from the edit screen (screen 2) -- the presentation
// screen shows it too (canEdit=false there), but as a single read-only badge for the selected
// level rather than the full picker row.
export const SongDifficultyBand: React.FC<SongDifficultyBandProps> = ({ song, hook, canEdit }) => {
  const { t } = useTranslation();

  if (!canEdit) {
    if (song.difficulty == null) return null;
    return <LevelBadge styles={DIFFICULTY_LEVEL_STYLES} labelKeyPrefix="guitarSong.difficulty.level" value={song.difficulty} size="lg" />;
  }

  return (
    <div>
      <div style={{ fontSize: 'var(--font-sm)', marginBottom: '6px' }}>{t('guitarSong.difficulty.label')}</div>
      <SongDifficultyPicker value={song.difficulty} onChange={(value) => hook.updateSongFields({ difficulty: value })} />
    </div>
  );
};
