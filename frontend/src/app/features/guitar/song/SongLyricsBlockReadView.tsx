import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';

import React from 'react';

import { GuitarSongLayoutBlock } from './types.ts';
import { WordWithChords } from './WordWithChords.tsx';

interface SongLyricsBlockReadViewProps {
  block: Pick<GuitarSongLayoutBlock, 'lyrics_words'>;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  lineSpacingPx: number;
  textSizePx: number;
  chordSizePx: number;
}

export const SongLyricsBlockReadView: React.FC<SongLyricsBlockReadViewProps> = ({
  block, diagramStyle, diagramSize, lineSpacingPx, textSizePx, chordSizePx,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: `${lineSpacingPx}px` }}>
    {(block.lyrics_words ?? []).map((line, lineIndex) => (
      <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {line.map((word, wordIndex) => (
          <WordWithChords
            key={wordIndex}
            word={word}
            diagramStyle={diagramStyle}
            diagramSize={diagramSize}
            textSizePx={textSizePx}
            chordSizePx={chordSizePx}
          />
        ))}
      </div>
    ))}
  </div>
);
