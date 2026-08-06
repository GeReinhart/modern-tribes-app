import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import {
  MAX_LYRICS_CHORD_SIZE_PX,
  MAX_LYRICS_LINE_SPACING_PX,
  MAX_LYRICS_TEXT_SIZE_PX,
  MIN_LYRICS_CHORD_SIZE_PX,
  MIN_LYRICS_LINE_SPACING_PX,
  MIN_LYRICS_TEXT_SIZE_PX,
} from './songLimits.ts';
import { GuitarSongUpdate } from './types.ts';

interface SongLyricsPresentationPrefsProps {
  lineSpacingPx: number;
  textSizePx: number;
  chordSizePx: number;
  onSave: (data: GuitarSongUpdate) => Promise<void>;
}

// Every field here applies immediately on blur, same as every other field in the block editor's
// other tabs -- no explicit save button, and nothing here ever closes the popup on its own.
export const SongLyricsPresentationPrefs: React.FC<SongLyricsPresentationPrefsProps> = ({
  lineSpacingPx, textSizePx, chordSizePx, onSave,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '8px' }}>
      <SongInlineEditableNumber
        value={lineSpacingPx} min={MIN_LYRICS_LINE_SPACING_PX} max={MAX_LYRICS_LINE_SPACING_PX}
        ariaLabel={t('guitarSong.form.lyricsLineSpacing')} label={t('guitarSong.form.lyricsLineSpacing')}
        onSave={(lyrics_line_spacing_px) => onSave({ lyrics_line_spacing_px })} style={{ width: '110px' }}
      />
      <SongInlineEditableNumber
        value={textSizePx} min={MIN_LYRICS_TEXT_SIZE_PX} max={MAX_LYRICS_TEXT_SIZE_PX}
        ariaLabel={t('guitarSong.form.lyricsTextSize')} label={t('guitarSong.form.lyricsTextSize')}
        onSave={(lyrics_text_size_px) => onSave({ lyrics_text_size_px })} style={{ width: '110px' }}
      />
      <SongInlineEditableNumber
        value={chordSizePx} min={MIN_LYRICS_CHORD_SIZE_PX} max={MAX_LYRICS_CHORD_SIZE_PX}
        ariaLabel={t('guitarSong.form.lyricsChordSize')} label={t('guitarSong.form.lyricsChordSize')}
        onSave={(lyrics_chord_size_px) => onSave({ lyrics_chord_size_px })} style={{ width: '110px' }}
      />
    </div>
  );
};
