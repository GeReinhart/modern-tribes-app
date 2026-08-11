import { FretValue, GuitarChord } from './types.ts';

const matchesFretFilter = (frets: FretValue[], fretFilter: string[]): boolean =>
  fretFilter.every((value, stringIndex) => !value || String(frets[stringIndex]) === value);

export const filterGuitarChords = (
  chords: GuitarChord[],
  search: string,
  rootFilter: string,
  fretFilter: string[],
): GuitarChord[] =>
  chords.filter(
    (chord) =>
      chord.name.toLowerCase().includes(search.trim().toLowerCase())
      && (!rootFilter || chord.root_note === rootFilter)
      && matchesFretFilter(chord.frets, fretFilter),
  );
