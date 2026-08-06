import { GuitarChord } from '../chords/types.ts';
import { GuitarSongLyricsWord, WordChordPosition } from './types.ts';

export const WORD_CHORD_POSITIONS: WordChordPosition[] = ['before', 'start', 'middle', 'end', 'after'];

export const chordAtPosition = (word: GuitarSongLyricsWord, position: WordChordPosition): GuitarChord | null =>
  word.chords[position] ?? null;
