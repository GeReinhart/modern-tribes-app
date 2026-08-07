import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { SongChordBadge } from './SongChordBadge.tsx';
import { chordAtPosition, groupWordsByLine } from './sectionWords.ts';
import { GuitarSongSection, GuitarSongSectionWord } from './types.ts';

interface WordWithChordsProps {
  word: GuitarSongSectionWord;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  textSizePx: number;
  chordSizePx: number;
}

const WordWithChords: React.FC<WordWithChordsProps> = ({ word, diagramStyle, diagramSize, textSizePx, chordSizePx }) => {
  const { theme } = useTheme();
  const before = chordAtPosition(word, 'before');
  const start = chordAtPosition(word, 'start');
  const middle = chordAtPosition(word, 'middle');
  const end = chordAtPosition(word, 'end');
  const after = chordAtPosition(word, 'after');
  const badgeRowHeight = chordSizePx + 2;

  const badge = (chord: typeof before) =>
    chord && (
      <SongChordBadge chord={chord} diagramStyle={diagramStyle} diagramSize={diagramSize} fontSizePx={chordSizePx} />
    );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
      {before && (
        <div style={{ height: `${badgeRowHeight}px`, display: 'flex', alignItems: 'flex-start' }}>{badge(before)}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Fixed height even when empty, so every word's text aligns at the same baseline;
            normal flow (not absolute) so wide chord names grow the line's spacing instead of
            overlapping the next word. */}
        <div style={{ display: 'flex', gap: '4px', height: `${badgeRowHeight}px`, alignItems: 'flex-start' }}>
          {badge(start)}
          {badge(middle)}
          {badge(end)}
        </div>
        {word.text && <div style={{ color: theme.colors.text, fontSize: `${textSizePx}px` }}>{word.text}</div>}
      </div>
      {after && (
        <div style={{ height: `${badgeRowHeight}px`, display: 'flex', alignItems: 'flex-start' }}>{badge(after)}</div>
      )}
    </div>
  );
};

interface SongSectionReadViewProps {
  section: GuitarSongSection;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  lineSpacingPx: number;
  textSizePx: number;
  chordSizePx: number;
}

export const SongSectionReadView: React.FC<SongSectionReadViewProps> = ({
  section, diagramStyle, diagramSize, lineSpacingPx, textSizePx, chordSizePx,
}) => {
  const { theme } = useTheme();
  const lines = section.content_mode === 'lyrics' ? groupWordsByLine(section.words) : [];

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontWeight: 700, color: theme.colors.text, marginBottom: '8px', fontSize: '16px' }}>
        {section.display_label}
      </div>
      {section.content_mode === 'lyrics' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${lineSpacingPx}px` }}>
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {line.map((word) => (
                <WordWithChords
                  key={word.id}
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
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {section.chords.map((sectionChord) => (
            <SongChordBadge
              key={sectionChord.id}
              chord={sectionChord.chord}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
              fontSizePx={chordSizePx}
            />
          ))}
        </div>
      )}
    </div>
  );
};
