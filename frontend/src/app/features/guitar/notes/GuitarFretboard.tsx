import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef } from 'react';

import FretboardCell, { CellStatus } from './FretboardCell.tsx';
import {
  FRET_MARKERS,
  GUITAR_STRINGS,
  SAMPLE_BY_POSITION,
  computeNoteAtPosition,
  computeOctaveAtPosition,
} from './sampleCatalog.ts';
import { Note } from './noteTypes.ts';
import { Octave, Sample } from './sampleCatalog.ts';

interface Props {
  activeSample: Sample | null;
  noteVisible: boolean;
  fretCount: number;
}

const CELL_W = 34;
const LABEL_W = 20;
const OPEN_H = 42;
const OPEN_PB = 2;
const NUT_H = 6;
const BORDER = 1;

const FRET_RATIO = Math.pow(0.5, 1 / 12);
const FRET_MIN_H = 24;
function fretH(fret: number): number {
  if (fret <= 1) return OPEN_H;
  return Math.max(FRET_MIN_H, Math.round(OPEN_H * Math.pow(FRET_RATIO, fret - 1)));
}

const GUITAR_W = GUITAR_STRINGS.length * CELL_W;

function cellStatus(
  str: typeof GUITAR_STRINGS[number],
  fret: number,
  noteAtPos: Note,
  octaveAtPos: Octave,
  currentNote: Note | null,
  currentOctave: Octave | null,
  activeSample: Sample | null,
): CellStatus {
  if (activeSample !== null && activeSample.string === str && activeSample.fret === fret) return 'active';
  if (currentNote !== null && currentOctave !== null && noteAtPos === currentNote && octaveAtPos === currentOctave) return 'match';
  return 'none';
}

const GuitarFretboard: React.FC<Props> = ({ activeSample, noteVisible, fretCount }) => {
  const { theme } = useTheme();
  const activeRef = useRef<HTMLDivElement | null>(null);

  const currentNote = activeSample?.note ?? null;
  const currentOctave = activeSample?.octave ?? null;
  const bodyFrets = Array.from({ length: fretCount }, (_, i) => i + 1);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSample]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <ExternalLabels theme={theme} bodyFrets={bodyFrets} />
      <div style={{ backgroundColor: theme.colors.surface, borderRadius: '8px', border: `${BORDER}px solid ${theme.colors.border}`, display: 'inline-block', userSelect: 'none', minWidth: `${GUITAR_W}px` }}>
        <OpenStringRow currentNote={currentNote} currentOctave={currentOctave} activeSample={activeSample} noteVisible={noteVisible} theme={theme} activeRef={activeRef} />
        <Nut width={GUITAR_W} theme={theme} />
        {bodyFrets.map(fret => (
          <FretRow
            key={fret}
            fret={fret}
            height={fretH(fret)}
            currentNote={currentNote}
            currentOctave={currentOctave}
            activeSample={activeSample}
            noteVisible={noteVisible}
            theme={theme}
            activeRef={activeRef}
          />
        ))}
      </div>
    </div>
  );
};

interface ThemeProps { theme: { colors: Record<string, string> }; }

const DOT_STYLE: React.CSSProperties = { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 };

const FretDot: React.FC<{ fret: number; color: string }> = ({ fret, color }) => {
  const dot = <span style={{ ...DOT_STYLE, backgroundColor: color }} />;
  if (fret === 12) return <div style={{ display: 'flex', gap: '3px' }}>{dot}{dot}</div>;
  return dot;
};

interface ExternalLabelsProps extends ThemeProps { bodyFrets: number[]; }

const ExternalLabels: React.FC<ExternalLabelsProps> = ({ theme, bodyFrets }) => (
  <div style={{ width: LABEL_W, flexShrink: 0, paddingTop: `${BORDER}px` }}>
    <div style={{ height: `${OPEN_H + OPEN_PB + NUT_H}px` }} />
    {bodyFrets.map(fret => {
      const borderH = FRET_MARKERS.has(fret) ? 2 : 1;
      return (
        <div key={fret} style={{ height: `${fretH(fret) + borderH}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {FRET_MARKERS.has(fret) && <FretDot fret={fret} color={theme.colors.ghost} />}
        </div>
      );
    })}
  </div>
);

interface OpenStringRowProps extends ThemeProps {
  currentNote: Note | null;
  currentOctave: Octave | null;
  activeSample: Sample | null;
  noteVisible: boolean;
  activeRef: React.MutableRefObject<HTMLDivElement | null>;
}
const OpenStringRow: React.FC<OpenStringRowProps> = ({ currentNote, currentOctave, activeSample, noteVisible, theme, activeRef }) => (
  <div style={{ display: 'flex', paddingBottom: `${OPEN_PB}px` }}>
    {GUITAR_STRINGS.map(str => {
      const note = computeNoteAtPosition(str, 0);
      const octave = computeOctaveAtPosition(str, 0);
      const isCatalog = SAMPLE_BY_POSITION.has(`${str}:0`);
      const status = cellStatus(str, 0, note, octave, currentNote, currentOctave, activeSample);
      return (
        <div key={str} style={{ width: CELL_W, height: OPEN_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={status === 'active' && isCatalog ? activeRef : undefined}>
            <FretboardCell note={note} status={status} noteVisible={noteVisible} theme={theme} size={CELL_W - 4} />
          </div>
        </div>
      );
    })}
  </div>
);

interface NutProps extends ThemeProps { width: number; }
const Nut: React.FC<NutProps> = ({ width, theme }) => (
  <div style={{ width: `${width}px`, height: `${NUT_H}px`, backgroundColor: theme.colors.text }} />
);

interface FretRowProps extends ThemeProps {
  fret: number;
  height: number;
  currentNote: Note | null;
  currentOctave: Octave | null;
  activeSample: Sample | null;
  noteVisible: boolean;
  activeRef: React.MutableRefObject<HTMLDivElement | null>;
}
const FretRow: React.FC<FretRowProps> = ({ fret, height, currentNote, currentOctave, activeSample, noteVisible, theme, activeRef }) => {
  const isMarker = FRET_MARKERS.has(fret);
  const circleSize = Math.min(height - 6, CELL_W - 4);
  return (
    <div style={{
      display: 'flex',
      borderBottom: isMarker ? `2px solid ${theme.colors.border}` : `1px solid ${theme.colors.ghost}`,
      alignItems: 'center',
    }}>
      {GUITAR_STRINGS.map((str, si) => {
        const note = computeNoteAtPosition(str, fret);
        const octave = computeOctaveAtPosition(str, fret);
        const isCatalog = SAMPLE_BY_POSITION.has(`${str}:${fret}`);
        const status = cellStatus(str, fret, note, octave, currentNote, currentOctave, activeSample);
        const displayStatus: CellStatus = isCatalog ? status : (status === 'active' ? 'none' : status);
        return (
          <div
            key={str}
            style={{ width: CELL_W, height, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: si > 0 ? `1px dashed ${theme.colors.ghost}` : undefined }}
          >
            <div ref={status === 'active' && isCatalog ? activeRef : undefined}>
              <FretboardCell note={note} status={displayStatus} noteVisible={noteVisible} theme={theme} size={circleSize} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuitarFretboard;
