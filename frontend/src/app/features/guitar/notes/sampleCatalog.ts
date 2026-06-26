import { ALL_NOTES, Note } from './noteTypes.ts';

export type GuitarString = 'E_LOW' | 'A' | 'D' | 'G' | 'B' | 'E_HIGH';
export type Octave = 1 | 2 | 3 | 4 | 5;

export interface Sample {
  id: number;
  file: string;
  string: GuitarString;
  fret: number;
  note: Note;
  octave: Octave;
}

export const GUITAR_STRINGS: GuitarString[] = ['E_LOW', 'A', 'D', 'G', 'B', 'E_HIGH'];
export const STRING_LABELS: Record<GuitarString, string> = {
  E_LOW: 'E', A: 'A', D: 'D', G: 'G', B: 'B', E_HIGH: 'e',
};
export const STRING_NUMBERS: Record<GuitarString, number> = {
  E_LOW: 6, A: 5, D: 4, G: 3, B: 2, E_HIGH: 1,
};
export const MAX_FRET = 22;
export const FRET_MARKERS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21]);

// Note index in ALL_NOTES for the open string (fret 0)
const STRING_BASE: Record<GuitarString, number> = {
  E_LOW: 7, A: 0, D: 5, G: 10, B: 2, E_HIGH: 7,
};

// Absolute semitone from C0 for each open string (octave changes at C in musical convention)
const STRING_BASE_C0: Record<GuitarString, number> = {
  E_LOW: 16, // E1 = 1×12 + 4
  A:     21, // A1 = 1×12 + 9
  D:     26, // D2 = 2×12 + 2
  G:     31, // G2 = 2×12 + 7
  B:     35, // B2 = 2×12 + 11
  E_HIGH:40, // E3 = 3×12 + 4
};

export function computeNoteAtPosition(str: GuitarString, fret: number): Note {
  return ALL_NOTES[(STRING_BASE[str] + fret) % 12];
}

export function computeOctaveAtPosition(str: GuitarString, fret: number): Octave {
  return Math.floor((STRING_BASE_C0[str] + fret) / 12) as Octave;
}

export const SAMPLE_CATALOG: Sample[] = [
  // E_LOW string — frets 0-4 → E1 F1 F#1 G1 G#1
  { id: 1,  file: '01.mp3', string: 'E_LOW', fret: 0,  note: 'E',  octave: 1 },
  { id: 2,  file: '02.mp3', string: 'E_LOW', fret: 1,  note: 'F',  octave: 1 },
  { id: 3,  file: '03.mp3', string: 'E_LOW', fret: 2,  note: 'F#', octave: 1 },
  { id: 4,  file: '04.mp3', string: 'E_LOW', fret: 3,  note: 'G',  octave: 1 },
  { id: 5,  file: '05.mp3', string: 'E_LOW', fret: 4,  note: 'G#', octave: 1 },
  // A string — frets 0-4 → A1 A#1 B1 C2 C#2
  { id: 6,  file: '06.mp3', string: 'A',     fret: 0,  note: 'A',  octave: 1 },
  { id: 7,  file: '07.mp3', string: 'A',     fret: 1,  note: 'A#', octave: 1 },
  { id: 8,  file: '08.mp3', string: 'A',     fret: 2,  note: 'B',  octave: 1 },
  { id: 9,  file: '09.mp3', string: 'A',     fret: 3,  note: 'C',  octave: 2 },
  { id: 10, file: '10.mp3', string: 'A',     fret: 4,  note: 'C#', octave: 2 },
  // D string — frets 0-4 → D2 D#2 E2 F2 F#2
  { id: 11, file: '11.mp3', string: 'D',     fret: 0,  note: 'D',  octave: 2 },
  { id: 12, file: '12.mp3', string: 'D',     fret: 1,  note: 'D#', octave: 2 },
  { id: 13, file: '13.mp3', string: 'D',     fret: 2,  note: 'E',  octave: 2 },
  { id: 14, file: '14.mp3', string: 'D',     fret: 3,  note: 'F',  octave: 2 },
  { id: 15, file: '15.mp3', string: 'D',     fret: 4,  note: 'F#', octave: 2 },
  // G string — frets 0-4 → G2 G#2 A2 A#2 B2
  { id: 16, file: '16.mp3', string: 'G',     fret: 0,  note: 'G',  octave: 2 },
  { id: 17, file: '17.mp3', string: 'G',     fret: 1,  note: 'G#', octave: 2 },
  { id: 18, file: '18.mp3', string: 'G',     fret: 2,  note: 'A',  octave: 2 },
  { id: 19, file: '19.mp3', string: 'G',     fret: 3,  note: 'A#', octave: 2 },
  { id: 20, file: '20.mp3', string: 'G',     fret: 4,  note: 'B',  octave: 2 },
  // B string — frets 0-4 → B2 C3 C#3 D3 D#3
  { id: 21, file: '21.mp3', string: 'B',     fret: 0,  note: 'B',  octave: 2 },
  { id: 22, file: '22.mp3', string: 'B',     fret: 1,  note: 'C',  octave: 3 },
  { id: 23, file: '23.mp3', string: 'B',     fret: 2,  note: 'C#', octave: 3 },
  { id: 24, file: '24.mp3', string: 'B',     fret: 3,  note: 'D',  octave: 3 },
  { id: 25, file: '25.mp3', string: 'B',     fret: 4,  note: 'D#', octave: 3 },
  // E_HIGH string — frets 0-14 → E3 … F#4
  { id: 26, file: '26.mp3', string: 'E_HIGH', fret: 0,  note: 'E',  octave: 3 },
  { id: 27, file: '27.mp3', string: 'E_HIGH', fret: 1,  note: 'F',  octave: 3 },
  { id: 28, file: '28.mp3', string: 'E_HIGH', fret: 2,  note: 'F#', octave: 3 },
  { id: 29, file: '29.mp3', string: 'E_HIGH', fret: 3,  note: 'G',  octave: 3 },
  { id: 30, file: '30.mp3', string: 'E_HIGH', fret: 4,  note: 'G#', octave: 3 },
  { id: 31, file: '31.mp3', string: 'E_HIGH', fret: 5,  note: 'A',  octave: 3 },
  { id: 32, file: '32.mp3', string: 'E_HIGH', fret: 6,  note: 'A#', octave: 3 },
  { id: 33, file: '33.mp3', string: 'E_HIGH', fret: 7,  note: 'B',  octave: 3 },
  { id: 34, file: '34.mp3', string: 'E_HIGH', fret: 8,  note: 'C',  octave: 4 },
  { id: 35, file: '35.mp3', string: 'E_HIGH', fret: 9,  note: 'C#', octave: 4 },
  { id: 36, file: '36.mp3', string: 'E_HIGH', fret: 10, note: 'D',  octave: 4 },
  { id: 37, file: '37.mp3', string: 'E_HIGH', fret: 11, note: 'D#', octave: 4 },
  { id: 38, file: '38.mp3', string: 'E_HIGH', fret: 12, note: 'E',  octave: 4 },
  { id: 39, file: '39.mp3', string: 'E_HIGH', fret: 13, note: 'F',  octave: 4 },
  { id: 40, file: '40.mp3', string: 'E_HIGH', fret: 14, note: 'F#', octave: 4 },
  { id: 41, file: '41.mp3', string: 'E_HIGH', fret: 15, note: 'G',  octave: 4 },
  { id: 42, file: '42.mp3', string: 'E_HIGH', fret: 16, note: 'G#', octave: 4 },
  { id: 43, file: '43.mp3', string: 'E_HIGH', fret: 17, note: 'A',  octave: 4 },
  { id: 44, file: '44.mp3', string: 'E_HIGH', fret: 18, note: 'A#', octave: 4 },
  { id: 45, file: '45.mp3', string: 'E_HIGH', fret: 19, note: 'B',  octave: 4 },
  { id: 46, file: '46.mp3', string: 'E_HIGH', fret: 20, note: 'C',  octave: 5 },
  { id: 47, file: '47.mp3', string: 'E_HIGH', fret: 21, note: 'C#', octave: 5 },
];

export const SAMPLE_BY_POSITION = new Map<string, Sample>(
  SAMPLE_CATALOG.map(s => [`${s.string}:${s.fret}`, s]),
);

export const SAMPLES_BY_NOTE = SAMPLE_CATALOG.reduce((acc, s) => {
  const arr = acc.get(s.note) ?? [];
  arr.push(s);
  acc.set(s.note, arr);
  return acc;
}, new Map<string, Sample[]>());
