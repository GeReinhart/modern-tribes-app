import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { isBlankHtml, SongChordGridBlock } from './SongChordGridBlock.tsx';
import { SongChordRow } from './SongChordRow.tsx';
import { SongFreeformHtml } from './SongFreeformHtml.tsx';
import { SongLyricsBlockReadView } from './SongLyricsBlockReadView.tsx';
import { blockTypeLabel } from './layoutBlockOptions.ts';
import { GuitarSongDetail, GuitarSongLyricsWord } from './types.ts';
import { CopiedBlock } from './useSongBlockClipboard.ts';

interface SongBlockClipboardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  copied: CopiedBlock | null;
  song: GuitarSongDetail;
}

// A copied 'sections' block's lyrics_words store plain chord ids (see useSongBlockClipboard.ts),
// not resolved GuitarChord objects like the block responses the read view otherwise always
// renders -- resolved here against the song's own chord list, the same way SongChordGridBlock
// already resolves chord_grid_rows' own ids internally.
const resolveLyricsWords = (
  words: CopiedBlock['lyrics_words'], chordsById: Record<string, GuitarChord>,
): GuitarSongLyricsWord[][] | null =>
  words?.map((line) => line.map((word) => ({
    text: word.text,
    chords: Object.fromEntries(
      Object.entries(word.chords)
        .filter(([, chordId]) => chordId && chordsById[chordId])
        .map(([position, chordId]) => [position, chordsById[chordId as string]]),
    ),
  }))) ?? null;

// Renders the copied block through the same read-mode components the page itself uses, so the
// preview is faithful by construction rather than a hand-rolled summary that could drift from
// what pasting it will actually look like.
export const SongBlockClipboardPreviewModal: React.FC<SongBlockClipboardPreviewModalProps> = ({
  isOpen, onClose, copied, song,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!copied) return null;

  const chordsById = Object.fromEntries(song.chords.map((songChord) => [songChord.chord.id, songChord.chord]));

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={blockTypeLabel(t, copied.block_type)} size="lg">
      <ModalBody>
        {copied.block_type === 'chord_grid' && (
          <SongChordGridBlock
            rows={copied.chord_grid_rows ?? []} songChords={song.chords} comment={copied.custom_content_html}
            diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size}
            chordSizePx={copied.chord_grid_chord_size_px}
          />
        )}
        {copied.block_type === 'chords' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {(copied.chords ?? [])
              .filter((blockChord) => chordsById[blockChord.chord_id])
              .map((blockChord) => (
                <SongChordRow
                  key={blockChord.chord_id}
                  songChord={{ chord_id: blockChord.chord_id, chord: chordsById[blockChord.chord_id], comment: blockChord.comment ?? null }}
                  isFirst isLast canEdit={false} canManage={false}
                  diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size}
                  onMoveUp={() => {}} onMoveDown={() => {}} onRemove={() => {}} onCommentBlur={() => {}}
                />
              ))}
          </div>
        )}
        {copied.block_type === 'custom' && (
          <>
            {copied.custom_title && (
              <div style={{ fontWeight: 700, color: theme.colors.text, marginBottom: '8px' }}>{copied.custom_title}</div>
            )}
            {!isBlankHtml(copied.custom_content_html) && <SongFreeformHtml html={copied.custom_content_html as string} />}
          </>
        )}
        {copied.block_type === 'sections' && (
          copied.lyrics_text !== null ? (
            <SongLyricsBlockReadView
              block={{ lyrics_words: resolveLyricsWords(copied.lyrics_words, chordsById) }}
              diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size}
              lineSpacingPx={song.lyrics_line_spacing_px} textSizePx={song.lyrics_text_size_px} chordSizePx={song.lyrics_chord_size_px}
            />
          ) : (
            <div style={{ color: theme.colors.secondary, fontSize: '13px' }}>{t('guitarSong.layout.clipboardUnavailable')}</div>
          )
        )}
      </ModalBody>
    </ThemedModal>
  );
};
