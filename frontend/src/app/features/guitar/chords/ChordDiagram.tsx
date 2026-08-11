import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { computeFretWindow, intervalSemitoneFromRoot } from './chordTheory.ts';
import { matchChordQuality, presentSemitones } from './chordNaming.ts';
import { IntervalMarker, MutedMarker } from './IntervalMarker.tsx';
import { FretValue } from './types.ts';

export type ChordDiagramStyle = 'full' | 'simple';
export type ChordDiagramSize = 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

const BASE_CELL_W = 28;
const BASE_ROW_H = 28;
const BASE_NUT_H = 4;
const BASE_MARKER_SIZE = 20;

const SIZE_SCALE: Record<ChordDiagramSize, number> = {
  xxs: 0.35,
  xs: 0.45,
  s: 0.55,
  m: 0.7,
  l: 0.85,
  xl: 1,
  xxl: 1.2,
};

// Below this, a "full" (labeled) marker's own interval text ("b7", "M3"...) no longer fits its
// circle at all -- the label overflows and visually bleeds into neighboring markers/rows instead
// of just looking cramped. "simple" markers are plain dots with no text, so they have no such
// floor and can shrink all the way down. This only affects "full" style at "xxs"/"xs"/"s"; every
// other size was already at or above it before this ramp existed.
const MIN_LABELED_SCALE = 0.55;

export const effectiveDiagramScale = (diagramSize: ChordDiagramSize, diagramStyle: ChordDiagramStyle): number => {
  const scale = SIZE_SCALE[diagramSize];
  return diagramStyle === 'simple' ? scale : Math.max(scale, MIN_LABELED_SCALE);
};

const MARKER_FRETS = new Set([3, 5, 7, 10, 12, 15]);

// Total rendered width of a diagram (6-string grid + the fret-number column beside it, which
// doesn't scale with diagramSize). Callers that give a diagram a fixed-width container (e.g. a
// card centered in a flex-wrap row) must size it with this, or a larger diagram overflows a
// container sized for a smaller one and visually overlaps its neighbors.
export const diagramPixelWidth = (diagramSize: ChordDiagramSize, diagramStyle: ChordDiagramStyle): number =>
  BASE_CELL_W * 6 * effectiveDiagramScale(diagramSize, diagramStyle) + 20;

interface ChordDiagramProps {
  frets: FretValue[];
  rootNote: string;
  diagramStyle?: ChordDiagramStyle;
  diagramSize?: ChordDiagramSize;
}

const degreeLabelsFor = (rootNote: string, frets: FretValue[]): Partial<Record<number, string>> => {
  const present = presentSemitones(rootNote, frets);
  const match = present.has(0) ? matchChordQuality(present) : null;
  return match?.degreeLabels ?? {};
};

const StringMarker: React.FC<{
  stringIndex: number;
  fret: number;
  rootNote: string;
  simple: boolean;
  markerSize: number;
  degreeLabels: Partial<Record<number, string>>;
}> = ({ stringIndex, fret, rootNote, simple, markerSize, degreeLabels }) => {
  const semitone = intervalSemitoneFromRoot(rootNote, stringIndex, fret);
  if (semitone === null) return null;
  return <IntervalMarker semitone={semitone} size={markerSize} simple={simple} label={degreeLabels[semitone]} />;
};

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  frets,
  rootNote,
  diagramStyle = 'full',
  diagramSize = 'm',
}) => {
  const { theme } = useTheme();
  const scale = effectiveDiagramScale(diagramSize, diagramStyle);
  const simple = diagramStyle === 'simple';
  const cellW = BASE_CELL_W * scale;
  const rowH = BASE_ROW_H * scale;
  const nutH = BASE_NUT_H * scale;
  const markerSize = BASE_MARKER_SIZE * scale;
  const { baseFret, windowSize } = computeFretWindow(frets);
  const rows = Array.from({ length: windowSize }, (_, i) => baseFret + i);
  const degreeLabels = degreeLabelsFor(rootNote, frets);

  return (
    <div style={{ display: 'inline-flex', userSelect: 'none', color: theme.colors.text }}>
      <div>
        <div style={{ height: '14px', fontSize: '11px', color: theme.colors.secondary }}>
          {baseFret > 1 ? `${baseFret}fr` : ''}
        </div>
        <OpenMuteRow
          frets={frets}
          rootNote={rootNote}
          simple={simple}
          cellW={cellW}
          rowH={rowH}
          markerSize={markerSize}
          degreeLabels={degreeLabels}
        />
        {baseFret === 1 && (
          <div style={{ width: cellW * 6, height: nutH, backgroundColor: theme.colors.text }} />
        )}
        {rows.map((fret) => (
          <FretRow
            key={fret}
            fret={fret}
            frets={frets}
            rootNote={rootNote}
            borderColor={theme.colors.ghost}
            simple={simple}
            cellW={cellW}
            rowH={rowH}
            markerSize={markerSize}
            degreeLabels={degreeLabels}
          />
        ))}
      </div>
      <div>
        <div style={{ height: '14px' }} />
        <div style={{ height: `${rowH}px` }} />
        {baseFret === 1 && <div style={{ height: `${nutH}px` }} />}
        {rows.map((fret) => {
          const isMarkerFret = MARKER_FRETS.has(fret);
          return (
            <div
              key={fret}
              style={{
                height: `${rowH}px`,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '4px',
                fontSize: isMarkerFret ? '12px' : '10px',
                fontWeight: isMarkerFret ? 700 : 400,
                color: isMarkerFret ? theme.colors.text : theme.colors.secondary,
              }}
            >
              {fret}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface OpenMuteRowProps {
  frets: FretValue[];
  rootNote: string;
  simple: boolean;
  cellW: number;
  rowH: number;
  markerSize: number;
  degreeLabels: Partial<Record<number, string>>;
}

const OpenMuteRow: React.FC<OpenMuteRowProps> = ({ frets, rootNote, simple, cellW, rowH, markerSize, degreeLabels }) => (
  <div style={{ display: 'flex' }}>
    {frets.map((fret, stringIndex) => (
      <div key={stringIndex} style={{ width: cellW, height: rowH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {fret === 'X' && <MutedMarker size={markerSize} />}
        {fret === 0 && (
          <StringMarker
            stringIndex={stringIndex}
            fret={0}
            rootNote={rootNote}
            simple={simple}
            markerSize={markerSize}
            degreeLabels={degreeLabels}
          />
        )}
      </div>
    ))}
  </div>
);

interface FretRowProps {
  fret: number;
  frets: FretValue[];
  rootNote: string;
  borderColor: string;
  simple: boolean;
  cellW: number;
  rowH: number;
  markerSize: number;
  degreeLabels: Partial<Record<number, string>>;
}

const FretRow: React.FC<FretRowProps> = ({ fret, frets, rootNote, borderColor, simple, cellW, rowH, markerSize, degreeLabels }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
    {frets.map((stringFret, stringIndex) => (
      <div
        key={stringIndex}
        style={{
          width: cellW,
          height: rowH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: stringIndex > 0 ? `1px solid ${borderColor}` : undefined,
        }}
      >
        {stringFret === fret && (
          <StringMarker
            stringIndex={stringIndex}
            fret={fret}
            rootNote={rootNote}
            simple={simple}
            markerSize={markerSize}
            degreeLabels={degreeLabels}
          />
        )}
      </div>
    ))}
  </div>
);
