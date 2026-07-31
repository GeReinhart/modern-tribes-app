import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { computeFretWindow, intervalSemitoneFromRoot } from './chordTheory.ts';
import { IntervalMarker, MutedMarker } from './IntervalMarker.tsx';
import { FretValue } from './types.ts';

const CELL_W = 34;
const ROW_H = 34;
const NUT_H = 5;
const MARKER_SIZE = 26;

interface ChordDiagramProps {
  frets: FretValue[];
  rootNote: string;
}

const StringMarker: React.FC<{ stringIndex: number; fret: number; rootNote: string }> = ({
  stringIndex,
  fret,
  rootNote,
}) => {
  const semitone = intervalSemitoneFromRoot(rootNote, stringIndex, fret);
  if (semitone === null) return null;
  return <IntervalMarker semitone={semitone} size={MARKER_SIZE} />;
};

export const ChordDiagram: React.FC<ChordDiagramProps> = ({ frets, rootNote }) => {
  const { theme } = useTheme();
  const { baseFret, windowSize } = computeFretWindow(frets);
  const rows = Array.from({ length: windowSize }, (_, i) => baseFret + i);

  return (
    <div style={{ display: 'inline-flex', userSelect: 'none', color: theme.colors.text }}>
      <div>
        <div style={{ height: '14px', fontSize: '11px', color: theme.colors.secondary }}>
          {baseFret > 1 ? `${baseFret}fr` : ''}
        </div>
        <OpenMuteRow frets={frets} rootNote={rootNote} />
        {baseFret === 1 && (
          <div style={{ width: CELL_W * 6, height: NUT_H, backgroundColor: theme.colors.text }} />
        )}
        {rows.map((fret) => (
          <FretRow key={fret} fret={fret} frets={frets} rootNote={rootNote} borderColor={theme.colors.ghost} />
        ))}
      </div>
      <div>
        <div style={{ height: '14px' }} />
        <div style={{ height: `${ROW_H}px` }} />
        {baseFret === 1 && <div style={{ height: `${NUT_H}px` }} />}
        {rows.map((fret) => (
          <div key={fret} style={{ height: `${ROW_H}px`, display: 'flex', alignItems: 'center', paddingLeft: '4px', fontSize: '10px', color: theme.colors.secondary }}>
            {fret}
          </div>
        ))}
      </div>
    </div>
  );
};

const OpenMuteRow: React.FC<{ frets: FretValue[]; rootNote: string }> = ({ frets, rootNote }) => (
  <div style={{ display: 'flex' }}>
    {frets.map((fret, stringIndex) => (
      <div key={stringIndex} style={{ width: CELL_W, height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {fret === 'X' && <MutedMarker size={MARKER_SIZE} />}
        {fret === 0 && <StringMarker stringIndex={stringIndex} fret={0} rootNote={rootNote} />}
      </div>
    ))}
  </div>
);

interface FretRowProps {
  fret: number;
  frets: FretValue[];
  rootNote: string;
  borderColor: string;
}

const FretRow: React.FC<FretRowProps> = ({ fret, frets, rootNote, borderColor }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
    {frets.map((stringFret, stringIndex) => (
      <div
        key={stringIndex}
        style={{
          width: CELL_W,
          height: ROW_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: stringIndex > 0 ? `1px solid ${borderColor}` : undefined,
        }}
      >
        {stringFret === fret && <StringMarker stringIndex={stringIndex} fret={fret} rootNote={rootNote} />}
      </div>
    ))}
  </div>
);
