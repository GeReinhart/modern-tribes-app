export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type TunerNote = (typeof ALL_NOTES)[number];

export interface PitchResult {
  frequency: number;
  note: TunerNote;
  octave: number;
  cents: number;
}

export interface GuitarTunerResult {
  frequency: number;
  targetNote: TunerNote;
  targetOctave: number;
  targetLabel: string;
  targetString: number;
  cents: number;
}
