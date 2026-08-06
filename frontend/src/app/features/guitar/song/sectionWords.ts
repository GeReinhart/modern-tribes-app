import { GuitarChord } from '../chords/types.ts';
import { GuitarSongSection, GuitarSongSectionWord, WordChordPosition } from './types.ts';

export const COMMON_SECTION_TYPES = ['Intro', 'Couplet', 'Refrain', 'Pont', 'Outro', 'Pré-refrain'];

export const WORD_CHORD_POSITIONS: WordChordPosition[] = ['before', 'start', 'middle', 'end', 'after'];

const WORD_CHORD_FIELD: Record<WordChordPosition, keyof GuitarSongSectionWord> = {
  before: 'chord_before',
  start: 'chord_start',
  middle: 'chord_middle',
  end: 'chord_end',
  after: 'chord_after',
};

export const chordAtPosition = (word: GuitarSongSectionWord, position: WordChordPosition): GuitarChord | null =>
  (word[WORD_CHORD_FIELD[position]] as GuitarChord | null) ?? null;

export const groupWordsByLine = (words: GuitarSongSectionWord[]): GuitarSongSectionWord[][] => {
  const byLine = new Map<number, GuitarSongSectionWord[]>();
  for (const word of words) {
    const line = byLine.get(word.line_index) ?? [];
    line.push(word);
    byLine.set(word.line_index, line);
  }
  return Array.from(byLine.keys())
    .sort((a, b) => a - b)
    .map((lineIndex) => (byLine.get(lineIndex) ?? []).slice().sort((a, b) => a.word_index - b.word_index));
};

export const sectionTypeSuggestions = (sections: GuitarSongSection[]): string[] => {
  const used = sections.map((section) => section.type_label);
  return Array.from(new Set([...used, ...COMMON_SECTION_TYPES]));
};
