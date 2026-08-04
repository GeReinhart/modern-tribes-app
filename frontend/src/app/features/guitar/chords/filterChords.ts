import { GuitarChord } from './types.ts';

export const filterGuitarChords = (
  chords: GuitarChord[],
  search: string,
  rootFilter: string,
): GuitarChord[] =>
  chords.filter(
    (chord) =>
      chord.name.toLowerCase().includes(search.trim().toLowerCase())
      && (!rootFilter || chord.root_note === rootFilter),
  );
