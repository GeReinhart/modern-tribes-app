import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { blockTypeLabel } from './layoutBlockOptions.ts';
import { SongLyricsTextEditor } from './SongLyricsTextEditor.tsx';
import { GuitarSongLayoutBlock, GuitarSongLyricsWordChordUpdate, WordChordPosition } from './types.ts';

interface SongLyricsBlockEditorProps {
  block: GuitarSongLayoutBlock;
  // The block block.linked_to_block_id names, if any -- resolved by the caller (findBlocksOfType
  // already has every 'sections' block in the layout at hand).
  linkTarget: GuitarSongLayoutBlock | undefined;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  textSizePx: number;
  chordSizePx: number;
  songChords: GuitarChord[];
  onSaveLyrics: (text: string) => Promise<void>;
  onSetWordChord: (
    lineIndex: number, wordIndex: number, position: WordChordPosition, data: GuitarSongLyricsWordChordUpdate,
  ) => Promise<void>;
}

export const SongLyricsBlockEditor: React.FC<SongLyricsBlockEditorProps> = ({
  block,
  linkTarget,
  diagramStyle,
  diagramSize,
  textSizePx,
  chordSizePx,
  songChords,
  onSaveLyrics,
  onSetWordChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div>
      {linkTarget && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.colors.secondary, fontSize: '13px', marginBottom: '8px' }}>
          <ThemedSvgIcon name="link" size={12} color={theme.colors.secondary} />
          {t('guitarSong.sections.linkedTo')} {linkTarget.custom_title || blockTypeLabel(t, 'sections')}
        </div>
      )}
      <SongLyricsTextEditor
        lyricsText={block.lyrics_text ?? ''}
        lyricsWords={block.lyrics_words}
        songChords={songChords}
        diagramStyle={diagramStyle}
        diagramSize={diagramSize}
        textSizePx={textSizePx}
        chordSizePx={chordSizePx}
        onSaveText={onSaveLyrics}
        onSetWordChord={onSetWordChord}
      />
    </div>
  );
};
