import { TunerNote } from './tunerTypes.ts';

export interface GuitarString {
  string: number;
  note: TunerNote;
  octave: number;
  frequency: number;
  label: string;
}

export const GUITAR_STRINGS: GuitarString[] = [
  { string: 6, note: 'E', octave: 2, frequency: 82.41,  label: 'Low E' },
  { string: 5, note: 'A', octave: 2, frequency: 110.00, label: 'A' },
  { string: 4, note: 'D', octave: 3, frequency: 146.83, label: 'D' },
  { string: 3, note: 'G', octave: 3, frequency: 196.00, label: 'G' },
  { string: 2, note: 'B', octave: 3, frequency: 246.94, label: 'B' },
  { string: 1, note: 'E', octave: 4, frequency: 329.63, label: 'High E' },
];

export function findClosestString(frequency: number): GuitarString {
  let best = GUITAR_STRINGS[0];
  let bestDist = Math.abs(Math.log2(frequency / best.frequency));
  for (const s of GUITAR_STRINGS) {
    const dist = Math.abs(Math.log2(frequency / s.frequency));
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

export function centsFromTarget(frequency: number, target: GuitarString): number {
  return Math.round(1200 * Math.log2(frequency / target.frequency));
}
