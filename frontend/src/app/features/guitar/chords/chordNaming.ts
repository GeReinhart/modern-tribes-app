import { intervalSemitoneFromRoot } from './chordTheory.ts';
import { FretValue } from './types.ts';

interface ChordFormula {
  suffix: string;
  required: number[];
  optional?: number[];
  degreeLabels?: Partial<Record<number, string>>;
}

// Semitones are relative to the root (0). Ordered from most-specific (most required tones) to
// least, so a formula's required/optional tones never overlap another's in a way that would make
// the match ambiguous — a 5th (7) is optional wherever it's commonly omitted on a 6-string guitar.
const CHORD_FORMULAS: ChordFormula[] = [
  { suffix: 'dim7', required: [0, 3, 6, 9] },
  { suffix: 'm7b5', required: [0, 3, 6, 10] },
  { suffix: 'maj9', required: [0, 4, 11, 2], optional: [7], degreeLabels: { 2: '9' } },
  { suffix: 'm9', required: [0, 3, 10, 2], optional: [7], degreeLabels: { 2: '9' } },
  { suffix: '13', required: [0, 4, 10, 9], optional: [7, 2], degreeLabels: { 2: '9', 9: '13' } },
  { suffix: '9', required: [0, 4, 10, 2], optional: [7], degreeLabels: { 2: '9' } },
  { suffix: 'maj7', required: [0, 4, 11], optional: [7] },
  { suffix: 'm7', required: [0, 3, 10], optional: [7] },
  { suffix: '7', required: [0, 4, 10], optional: [7] },
  { suffix: 'add9', required: [0, 4, 2], optional: [7], degreeLabels: { 2: '9' } },
  { suffix: '6', required: [0, 4, 9], optional: [7] },
  { suffix: 'm6', required: [0, 3, 9], optional: [7] },
  { suffix: 'dim', required: [0, 3, 6] },
  { suffix: 'aug', required: [0, 4, 8] },
  { suffix: 'sus2', required: [0, 2, 7] },
  { suffix: 'sus4', required: [0, 5, 7] },
  { suffix: 'm', required: [0, 3, 7] },
  { suffix: '', required: [0, 4, 7] },
];

export interface ChordQualityMatch {
  suffix: string;
  degreeLabels: Partial<Record<number, string>>;
}

const matchesFormula = (present: Set<number>, formula: ChordFormula): boolean => {
  const allowed = new Set([...formula.required, ...(formula.optional ?? [])]);
  const hasAllRequired = formula.required.every((semitone) => present.has(semitone));
  const hasNoUnexpectedTone = [...present].every((semitone) => allowed.has(semitone));
  return hasAllRequired && hasNoUnexpectedTone;
};

export const matchChordQuality = (present: Set<number>): ChordQualityMatch | null => {
  const formula = CHORD_FORMULAS.find((candidate) => matchesFormula(present, candidate));
  return formula ? { suffix: formula.suffix, degreeLabels: formula.degreeLabels ?? {} } : null;
};

export const presentSemitones = (rootNote: string, frets: FretValue[]): Set<number> => {
  const semitones = new Set<number>();
  frets.forEach((fret, stringIndex) => {
    if (fret === 'X') return;
    const semitone = intervalSemitoneFromRoot(rootNote, stringIndex, fret);
    if (semitone !== null) semitones.add(semitone);
  });
  return semitones;
};

export const suggestChordName = (rootNote: string, frets: FretValue[]): string | null => {
  const present = presentSemitones(rootNote, frets);
  if (!present.has(0)) return null;
  const match = matchChordQuality(present);
  return match ? `${rootNote}${match.suffix}` : null;
};
