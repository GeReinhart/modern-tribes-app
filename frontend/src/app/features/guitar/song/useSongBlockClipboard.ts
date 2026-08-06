import { useState } from 'react';

import {
  BlockChordInput, ChordGridCell, GuitarSongLayoutBlock, GuitarSongLyricsWordInput, TitleHeadingLevel,
} from './types.ts';

const STORAGE_KEY = 'guitarSong.layout.blockClipboard';

export type CopyableBlockType = 'sections' | 'chord_grid' | 'custom' | 'chords';

export interface CopiedBlock {
  // Paste is refused outside this song -- the clipboard survives a page reload but isn't scoped
  // to any one song, so this is what actually enforces "same song only".
  song_id: string;
  block_type: CopyableBlockType;
  width_twelfths: number;
  zoom_percent: number;
  show_card: boolean;
  title_heading_level: TitleHeadingLevel;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
  custom_title: string | null;
  custom_content_html: string | null;
  chord_grid_rows: ChordGridCell[][] | null;
  // Only meaningful for a chord_grid block -- carried directly, like chord_grid_rows above.
  chord_grid_chord_size_px: number;
  // 'sections' blocks only -- carried directly, like every other content field here, so pasting
  // is a single row-replace instead of a second step that duplicates content server-side.
  lyrics_text: string | null;
  lyrics_words: GuitarSongLyricsWordInput[][] | null;
  linked_to_block_id: string | null;
  // 'chords' blocks only -- carried directly, like chord_grid_rows above.
  chords: BlockChordInput[] | null;
}

const readStored = (): CopiedBlock | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CopiedBlock;
  } catch {
    return null;
  }
};

export const buildCopiedBlock = (
  songId: string, block: GuitarSongLayoutBlock, blockType: CopyableBlockType,
): CopiedBlock => ({
  song_id: songId,
  block_type: blockType,
  width_twelfths: block.width_twelfths,
  zoom_percent: block.zoom_percent,
  show_card: block.show_card,
  title_heading_level: block.title_heading_level,
  padding_top_mm: block.padding_top_mm,
  padding_right_mm: block.padding_right_mm,
  padding_bottom_mm: block.padding_bottom_mm,
  padding_left_mm: block.padding_left_mm,
  custom_title: block.custom_title,
  custom_content_html: block.custom_content_html,
  chord_grid_rows: block.chord_grid_rows,
  chord_grid_chord_size_px: block.chord_grid_chord_size_px,
  lyrics_text: block.lyrics_text,
  lyrics_words: block.lyrics_words?.map((line) => line.map((word) => ({
    text: word.text,
    chords: Object.fromEntries(
      Object.entries(word.chords).map(([position, chord]) => [position, chord.id]),
    ),
  }))) ?? null,
  linked_to_block_id: block.linked_to_block_id,
  chords: block.chords?.map((blockChord) => ({ chord_id: blockChord.chord_id, comment: blockChord.comment })) ?? null,
});

export const useSongBlockClipboard = () => {
  const [clipboard, setClipboard] = useState<CopiedBlock | null>(readStored);

  const copyBlock = (copied: CopiedBlock) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copied));
    setClipboard(copied);
  };

  return { clipboard, copyBlock };
};
