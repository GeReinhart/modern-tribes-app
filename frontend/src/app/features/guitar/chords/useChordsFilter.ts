import { useMemo, useState } from 'react';

import { filterGuitarChords } from './filterChords.ts';
import { EMPTY_FRET_FILTER } from './fretOptions.ts';
import { GuitarChord } from './types.ts';

export interface ChordsFilterState {
  search: string;
  setSearch: (value: string) => void;
  rootFilter: string;
  setRootFilter: (value: string) => void;
  fretFilter: string[];
  onFretFilterChange: (stringIndex: number, value: string) => void;
  filteredChords: GuitarChord[];
}

export const useChordsFilter = (chords: GuitarChord[]): ChordsFilterState => {
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState('');
  const [fretFilter, setFretFilter] = useState<string[]>(EMPTY_FRET_FILTER);

  const onFretFilterChange = (stringIndex: number, value: string) => {
    setFretFilter((prev) => prev.map((v, i) => (i === stringIndex ? value : v)));
  };

  const filteredChords = useMemo(
    () => filterGuitarChords(chords, search, rootFilter, fretFilter),
    [chords, search, rootFilter, fretFilter],
  );

  return {
    search,
    setSearch,
    rootFilter,
    setRootFilter,
    fretFilter,
    onFretFilterChange,
    filteredChords,
  };
};
