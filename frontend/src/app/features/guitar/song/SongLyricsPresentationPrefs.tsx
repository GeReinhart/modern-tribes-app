import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

// Only takes effect once explicitly saved -- relying on blur-to-commit meant clicking the
// number input's own native spinner arrows (which never blurs the field), then navigating away
// without clicking elsewhere first, silently discarded the change. Same gap the column/block
// menus had.
export const SongLyricsPresentationPrefs: React.FC<SongLyricsPresentationPrefsProps> = ({
  lineSpacingPx, textSizePx, chordSizePx, onSave,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ lineSpacingPx, textSizePx, chordSizePx });
  useEffect(() => setDraft({ lineSpacingPx, textSizePx, chordSizePx }), [lineSpacingPx, textSizePx, chordSizePx]);

  const handleSave = () => {
    onSave({
      lyrics_line_spacing_px: draft.lineSpacingPx,
      lyrics_text_size_px: draft.textSizePx,
      lyrics_chord_size_px: draft.chordSizePx,
    });
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '8px' }}>
      <ThemedInput
        type="number" min={MIN_LYRICS_LINE_SPACING_PX} max={MAX_LYRICS_LINE_SPACING_PX} value={draft.lineSpacingPx}
        onChange={(e) => setDraft((prev) => ({ ...prev, lineSpacingPx: Number(e.target.value) }))}
        label={t('guitarSong.form.lyricsLineSpacing')} aria-label={t('guitarSong.form.lyricsLineSpacing')}
        style={{ width: '110px' }}
      />
      <ThemedInput
        type="number" min={MIN_LYRICS_TEXT_SIZE_PX} max={MAX_LYRICS_TEXT_SIZE_PX} value={draft.textSizePx}
        onChange={(e) => setDraft((prev) => ({ ...prev, textSizePx: Number(e.target.value) }))}
        label={t('guitarSong.form.lyricsTextSize')} aria-label={t('guitarSong.form.lyricsTextSize')}
        style={{ width: '110px' }}
      />
      <ThemedInput
        type="number" min={MIN_LYRICS_CHORD_SIZE_PX} max={MAX_LYRICS_CHORD_SIZE_PX} value={draft.chordSizePx}
        onChange={(e) => setDraft((prev) => ({ ...prev, chordSizePx: Number(e.target.value) }))}
        label={t('guitarSong.form.lyricsChordSize')} aria-label={t('guitarSong.form.lyricsChordSize')}
        style={{ width: '110px' }}
      />
      <ThemedIconButton action={{ icon: 'save', label: t('guitarSong.layout.save'), onClick: handleSave }} />
    </div>
  );
};
