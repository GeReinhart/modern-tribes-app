import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { SongChordBadge } from './SongChordBadge.tsx';
import { chordAtPosition } from './lyricsWords.ts';
import { GuitarSongLyricsWord } from './types.ts';

interface WordWithChordsProps {
  word: GuitarSongLyricsWord;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  textSizePx: number;
  chordSizePx: number;
  // Off in the word-chord attach editor: a chord badge there must not open its own diagram
  // preview (SongChordBadge's own click target) since the whole word is already a button that
  // opens the attach modal -- a clickable badge nested inside would be an invalid, ambiguous
  // nested button.
  interactiveChords?: boolean;
  // Shown in place of the word's text when it's blank (an intentional gap in the lyrics) --
  // only meaningful in the attach editor, where the slot must still show something clickable;
  // the real presentation view leaves a blank word truly empty.
  emptyTextLabel?: string;
}

export const WordWithChords: React.FC<WordWithChordsProps> = ({
  word, diagramStyle, diagramSize, textSizePx, chordSizePx, interactiveChords = true, emptyTextLabel,
}) => {
  const { theme } = useTheme();
  const before = chordAtPosition(word, 'before');
  const start = chordAtPosition(word, 'start');
  const middle = chordAtPosition(word, 'middle');
  const end = chordAtPosition(word, 'end');
  const after = chordAtPosition(word, 'after');
  const badgeRowHeight = chordSizePx + 2;

  const badge = (chord: GuitarChord | null) => {
    if (!chord) return null;
    if (interactiveChords) {
      return <SongChordBadge chord={chord} diagramStyle={diagramStyle} diagramSize={diagramSize} fontSizePx={chordSizePx} />;
    }
    return <span style={{ fontSize: `${chordSizePx}px`, fontWeight: 700, color: theme.colors.primary }}>{chord.name}</span>;
  };

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
        {word.text ? (
          <div style={{ color: theme.colors.text, fontSize: `${textSizePx}px` }}>{word.text}</div>
        ) : emptyTextLabel ? (
          <div style={{ color: theme.colors.text, fontSize: `${textSizePx}px`, fontStyle: 'italic', opacity: 0.6 }}>
            {emptyTextLabel}
          </div>
        ) : null}
      </div>
      {after && (
        <div style={{ height: `${badgeRowHeight}px`, display: 'flex', alignItems: 'flex-start' }}>{badge(after)}</div>
      )}
    </div>
  );
};
