import { FretValue } from './types.ts';

// Standard tuning, low E (string index 0) to high E (string index 5), as semitones from C.
export const STANDARD_TUNING_SEMITONES = [4, 9, 2, 7, 11, 4];

export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'B#': 0,
  'C#': 1, Db: 1,
  D: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'E#': 5,
  'F#': 6, Gb: 6,
  G: 7,
  'G#': 8, Ab: 8,
  A: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11,
};

export const INTERVAL_LABELS = [
  'R', 'b2', 'M2', 'b3', 'M3', 'P4', 'b5', 'P5', 'b6', 'M6', 'b7', 'M7',
];

const ROOT_FROM_NAME_RE = /^([A-Ga-g])([#b]?)/;

export function proposeRootNote(name: string): string | null {
  const match = ROOT_FROM_NAME_RE.exec(name.trim());
  if (!match) return null;
  const [, letter, accidental] = match;
  return letter.toUpperCase() + accidental;
}

export function semitoneOfNote(note: string): number | null {
  return NOTE_TO_SEMITONE[note] ?? null;
}

export function intervalSemitoneFromRoot(
  rootNote: string,
  stringIndex: number,
  fret: number,
): number | null {
  const rootSemitone = semitoneOfNote(rootNote);
  if (rootSemitone === null) return null;
  const noteSemitone = (STANDARD_TUNING_SEMITONES[stringIndex] + fret) % 12;
  return ((noteSemitone - rootSemitone) % 12 + 12) % 12;
}

export interface FretWindow {
  baseFret: number;
  windowSize: number;
}

export function computeFretWindow(frets: FretValue[]): FretWindow {
  const hasOpenString = frets.some((f) => f === 0);
  const positiveFrets = frets.filter((f): f is number => typeof f === 'number' && f > 0);
  const baseFret = hasOpenString || positiveFrets.length === 0
    ? 1
    : Math.min(...positiveFrets);
  const maxFret = positiveFrets.length > 0 ? Math.max(...positiveFrets) : baseFret;
  const windowSize = Math.max(4, maxFret - baseFret + 1);
  return { baseFret, windowSize };
}
