import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongMasteryPicker } from './SongMasteryPicker.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongMasteryBandProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
}

// Your own mastery rating is private and personal -- always settable here (edit screen and
// presentation screen alike), independent of the song's own editorial state or content lock.
export const SongMasteryBand: React.FC<SongMasteryBandProps> = ({ song, hook }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ fontSize: 'var(--font-sm)', marginBottom: '6px' }}>{t('guitarSong.mastery.label')}</div>
      <SongMasteryPicker value={song.my_mastery} onChange={hook.setMyMastery} />
    </div>
  );
};
