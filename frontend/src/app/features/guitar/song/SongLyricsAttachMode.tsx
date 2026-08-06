import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLyricsWordAttachModal } from './SongLyricsWordAttachModal.tsx';
import { GuitarSongLyricsWord, GuitarSongLyricsWordChordUpdate, WordChordPosition } from './types.ts';
import { WordWithChords } from './WordWithChords.tsx';

interface FlatWord {
  lineIndex: number;
  wordIndex: number;
  word: GuitarSongLyricsWord;
}

interface SongLyricsAttachModeProps {
  lines: GuitarSongLyricsWord[][];
  songChords: GuitarChord[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  textSizePx: number;
  chordSizePx: number;
  onSetWordChord: (
    lineIndex: number, wordIndex: number, position: WordChordPosition, data: GuitarSongLyricsWordChordUpdate,
  ) => Promise<void>;
}

export const SongLyricsAttachMode: React.FC<SongLyricsAttachModeProps> = ({
  lines,
  songChords,
  diagramStyle,
  diagramSize,
  textSizePx,
  chordSizePx,
  onSetWordChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeCoord, setActiveCoord] = useState<{ lineIndex: number; wordIndex: number } | null>(null);
  const flatWords: FlatWord[] = lines.flatMap(
    (line, lineIndex) => line.map((word, wordIndex): FlatWord => ({ lineIndex, wordIndex, word })),
  );
  const activeIndex = activeCoord
    ? flatWords.findIndex((entry) => entry.lineIndex === activeCoord.lineIndex && entry.wordIndex === activeCoord.wordIndex)
    : -1;
  const activeEntry = activeIndex !== -1 ? flatWords[activeIndex] : null;
  const hasPrevWord = activeIndex > 0;
  const hasNextWord = activeIndex !== -1 && activeIndex < flatWords.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {line.map((word, wordIndex) => (
            <button
              key={wordIndex}
              type="button"
              onClick={() => setActiveCoord({ lineIndex, wordIndex })}
              style={{
                border: `1px dashed ${theme.colors.border}`,
                borderRadius: '6px',
                padding: '4px 8px',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <WordWithChords
                word={word}
                diagramStyle={diagramStyle}
                diagramSize={diagramSize}
                textSizePx={textSizePx}
                chordSizePx={chordSizePx}
                interactiveChords={false}
                emptyTextLabel={t('guitarSong.sections.emptySlotLabel')}
              />
            </button>
          ))}
        </div>
      ))}
      <SongLyricsWordAttachModal
        word={activeEntry?.word ?? null}
        lineIndex={activeEntry?.lineIndex ?? null}
        wordIndex={activeEntry?.wordIndex ?? null}
        songChords={songChords}
        onClose={() => setActiveCoord(null)}
        onSetWordChord={onSetWordChord}
        hasPrevWord={hasPrevWord}
        hasNextWord={hasNextWord}
        onPrevWord={() => setActiveCoord({ lineIndex: flatWords[activeIndex - 1].lineIndex, wordIndex: flatWords[activeIndex - 1].wordIndex })}
        onNextWord={() => setActiveCoord({ lineIndex: flatWords[activeIndex + 1].lineIndex, wordIndex: flatWords[activeIndex + 1].wordIndex })}
      />
    </div>
  );
};
