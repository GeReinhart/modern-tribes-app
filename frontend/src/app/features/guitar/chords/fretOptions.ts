import { SelectOption } from '@/app/platform/core/common.types.ts';

export const FRET_OPTIONS: SelectOption[] = [
  { value: 'X', label: 'X' },
  ...Array.from({ length: 21 }, (_, fret) => ({ value: String(fret), label: String(fret) })),
];

export const ROOT_NOTE_OPTIONS: SelectOption[] = [
  'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#',
].map((note) => ({ value: note, label: note }));

export const DEFAULT_FRETS: string[] = ['0', '0', '0', '0', '0', '0'];

export const EMPTY_FRET_FILTER: string[] = ['', '', '', '', '', ''];
