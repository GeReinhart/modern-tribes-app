import { isDocumentBackedBlockType, isTitleEditableBlockType } from './layoutBlockOptions.ts';
import { DEFAULT_CHORD_GRID_CHORD_SIZE_PX } from './songLimits.ts';
import {
  BlockChordInput,
  ChordGridCell,
  GuitarSongLayoutBlockInput,
  GuitarSongLayoutColumnInput,
  GuitarSongLayoutRow,
  GuitarSongLayoutRowInput,
  GuitarSongLyricsWordInput,
  LayoutAlign,
  LayoutBlockType,
  TitleHeadingLevel,
} from './types.ts';
import { CopiedBlock } from './useSongBlockClipboard.ts';

export const CUSTOM_BLOCK_TYPE: LayoutBlockType = 'custom';
export const CHORD_GRID_BLOCK_TYPE: LayoutBlockType = 'chord_grid';
export const SECTIONS_BLOCK_TYPE: LayoutBlockType = 'sections';
const DEFAULT_CHORD_GRID_ROWS = 2;
const DEFAULT_CHORD_GRID_COLUMNS = 2;

export interface DraftBlock {
  key: string;
  block_type: LayoutBlockType;
  width_twelfths: number;
  zoom_percent: number;
  show_card: boolean;
  title_heading_level: TitleHeadingLevel;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
  // null means "use the block type's default label/no title"; '' means explicitly removed
  // (only meaningful for title-editable and custom block types) -- these must stay distinct,
  // never collapsed into each other, or clearing a title would look identical to never having
  // set one and vice versa.
  custom_title: string | null;
  custom_content_html: string;
  // Only meaningful for a chord_grid block; null for every other type. Always round-tripped
  // as-is (never conditioned on block_type at the read/write boundary below) so a chord grid's
  // content survives every row replace triggered by an edit to something else entirely (a
  // sibling column's padding, this same block's own zoom...).
  chord_grid_rows: ChordGridCell[][] | null;
  // Only meaningful for a chord_grid block; same "always round-tripped as-is" rule as
  // chord_grid_rows above.
  chord_grid_chord_size_px: number;
  // 'sections' blocks only -- same "always round-tripped as-is" rule as chord_grid_rows above,
  // for the same reason: a "Lyrics & Chords" block's content must survive every row replace
  // triggered by an edit to something else entirely. null means the block hasn't been set up
  // yet (shows the setup picker); '' is a deliberate, valid "configured but empty" state -- the
  // two must stay distinct, never collapsed into each other.
  lyrics_text: string | null;
  lyrics_words: GuitarSongLyricsWordInput[][] | null;
  linked_to_block_id: string | null;
  // 'chords' blocks only -- same "always round-tripped as-is" rule as chord_grid_rows above.
  chords: BlockChordInput[] | null;
}

const emptyChordGridCell = (): ChordGridCell => ({
  border_top: false, border_right: false, border_bottom: false, border_left: false, items: [],
});

const defaultChordGridRows = (): ChordGridCell[][] =>
  Array.from({ length: DEFAULT_CHORD_GRID_ROWS }, () =>
    Array.from({ length: DEFAULT_CHORD_GRID_COLUMNS }, emptyChordGridCell));

export interface DraftColumn {
  key: string;
  blocks: DraftBlock[];
  width_twelfths: number;
  align: LayoutAlign;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
  separator_left: boolean;
  separator_right: boolean;
}

export const ROW_WIDTH_TWELFTHS = 12;
export const DEFAULT_ZOOM_PERCENT = 100;

// A sensible starting width per element, so a freshly added block doesn't always claim the
// whole row — the user can still resize it afterward from its own presentation menu.
const DEFAULT_BLOCK_WIDTH_TWELFTHS: Partial<Record<LayoutBlockType, number>> = {
  title: 4,
  author: 4,
  tempo: 3,
  time_signature: 2,
  capo: 2,
  description: 9,
  chords: 9,
  sections: 12,
  labels: 6,
  chord_grid: 12,
};

export const emptyDraftBlock = (blockType: LayoutBlockType): DraftBlock => ({
  key: crypto.randomUUID(),
  block_type: blockType,
  width_twelfths: DEFAULT_BLOCK_WIDTH_TWELFTHS[blockType] ?? ROW_WIDTH_TWELFTHS,
  zoom_percent: DEFAULT_ZOOM_PERCENT,
  show_card: false,
  // 'sections' ("Lyrics & Chords") parts default to the toned-down H5 (non-bold, italic)
  // instead of every other type's H3 -- see SongEditableBlockTitle.
  title_heading_level: blockType === SECTIONS_BLOCK_TYPE ? 'h5' : 'h3',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
  custom_title: null,
  custom_content_html: '',
  chord_grid_rows: blockType === CHORD_GRID_BLOCK_TYPE ? defaultChordGridRows() : null,
  chord_grid_chord_size_px: DEFAULT_CHORD_GRID_CHORD_SIZE_PX,
  // A fresh 'sections' block starts unconfigured (lyrics_text: null) -- its own presentation
  // menu shows the setup picker until the user starts typing lyrics or links to another block.
  lyrics_text: null,
  lyrics_words: null,
  linked_to_block_id: null,
  chords: null,
});

// A pasted block carries over its presentation settings and its content -- including a 'sections'
// block's lyrics/chords, which now live directly on the block like everything else here.
export const draftBlockFromCopy = (copied: CopiedBlock): DraftBlock => ({
  key: crypto.randomUUID(),
  block_type: copied.block_type,
  width_twelfths: copied.width_twelfths,
  zoom_percent: copied.zoom_percent,
  show_card: copied.show_card,
  title_heading_level: copied.title_heading_level,
  padding_top_mm: copied.padding_top_mm,
  padding_right_mm: copied.padding_right_mm,
  padding_bottom_mm: copied.padding_bottom_mm,
  padding_left_mm: copied.padding_left_mm,
  custom_title: copied.custom_title,
  custom_content_html: copied.custom_content_html ?? '',
  chord_grid_rows: copied.chord_grid_rows,
  chord_grid_chord_size_px: copied.chord_grid_chord_size_px,
  lyrics_text: copied.lyrics_text,
  lyrics_words: copied.lyrics_words,
  linked_to_block_id: copied.linked_to_block_id,
  chords: copied.chords,
});

export const emptyDraftColumn = (blockType: LayoutBlockType, widthTwelfths: number): DraftColumn => ({
  key: crypto.randomUUID(),
  blocks: [emptyDraftBlock(blockType)],
  width_twelfths: widthTwelfths,
  align: 'left',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
  separator_left: false,
  separator_right: false,
});

// A brand new column pre-filled with a pasted block, instead of an empty one of a chosen type.
export const draftColumnFromCopy = (copied: CopiedBlock, widthTwelfths: number): DraftColumn => ({
  key: crypto.randomUUID(),
  blocks: [draftBlockFromCopy(copied)],
  width_twelfths: widthTwelfths,
  align: 'left',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
  separator_left: false,
  separator_right: false,
});

// A column with no blocks at all -- a plain spacer that just claims some of the row's width.
// Elements can still be added to it later from its own "add element" picker.
export const emptyDraftSpacerColumn = (widthTwelfths: number): DraftColumn => ({
  key: crypto.randomUUID(),
  blocks: [],
  width_twelfths: widthTwelfths,
  align: 'left',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
  separator_left: false,
  separator_right: false,
});

const draftLyricsWords = (block: GuitarSongLayoutRow['columns'][number]['blocks'][number]): GuitarSongLyricsWordInput[][] | null =>
  block.lyrics_words?.map((line) => line.map((word) => ({
    text: word.text,
    chords: Object.fromEntries(Object.entries(word.chords).map(([position, chord]) => [position, chord.id])),
  }))) ?? null;

const draftBlockChords = (block: GuitarSongLayoutRow['columns'][number]['blocks'][number]): BlockChordInput[] | null =>
  block.chords?.map((blockChord) => ({ chord_id: blockChord.chord_id, comment: blockChord.comment })) ?? null;

export const draftColumnsFromRow = (row: GuitarSongLayoutRow): DraftColumn[] =>
  [...row.columns].sort((a, b) => a.position - b.position).map((column): DraftColumn => ({
    key: column.id,
    blocks: column.blocks.map((block, index): DraftBlock => ({
      key: `${column.id}-${index}`,
      block_type: block.block_type,
      width_twelfths: block.width_twelfths,
      zoom_percent: block.zoom_percent,
      show_card: block.show_card,
      title_heading_level: block.title_heading_level,
      padding_top_mm: block.padding_top_mm,
      padding_right_mm: block.padding_right_mm,
      padding_bottom_mm: block.padding_bottom_mm,
      padding_left_mm: block.padding_left_mm,
      custom_title: block.custom_title,
      custom_content_html: block.custom_content_html ?? '',
      chord_grid_rows: block.chord_grid_rows,
      chord_grid_chord_size_px: block.chord_grid_chord_size_px,
      lyrics_text: block.lyrics_text,
      lyrics_words: draftLyricsWords(block),
      linked_to_block_id: block.linked_to_block_id,
      chords: draftBlockChords(block),
    })),
    width_twelfths: column.width_twelfths,
    align: column.align,
    padding_top_mm: column.padding_top_mm,
    padding_right_mm: column.padding_right_mm,
    padding_bottom_mm: column.padding_bottom_mm,
    padding_left_mm: column.padding_left_mm,
    separator_left: column.separator_left,
    separator_right: column.separator_right,
  }));

export const draftColumnsToInput = (
  pageBreakBefore: boolean, columns: DraftColumn[],
): GuitarSongLayoutRowInput => ({
  page_break_before: pageBreakBefore,
  columns: columns.map((column): GuitarSongLayoutColumnInput => ({
    blocks: column.blocks.map((block): GuitarSongLayoutBlockInput => ({
      block_type: block.block_type,
      width_twelfths: block.width_twelfths,
      zoom_percent: block.zoom_percent,
      show_card: block.show_card,
      title_heading_level: block.title_heading_level,
      padding_top_mm: block.padding_top_mm,
      padding_right_mm: block.padding_right_mm,
      padding_bottom_mm: block.padding_bottom_mm,
      padding_left_mm: block.padding_left_mm,
      custom_title: block.block_type === CUSTOM_BLOCK_TYPE || isTitleEditableBlockType(block.block_type) ? block.custom_title : null,
      custom_content_html: isDocumentBackedBlockType(block.block_type) ? block.custom_content_html : null,
      chord_grid_rows: block.chord_grid_rows,
      chord_grid_chord_size_px: block.chord_grid_chord_size_px,
      lyrics_text: block.lyrics_text,
      lyrics_words: block.lyrics_words,
      linked_to_block_id: block.linked_to_block_id,
      chords: block.chords,
    })),
    width_twelfths: column.width_twelfths,
    align: column.align,
    padding_top_mm: column.padding_top_mm,
    padding_right_mm: column.padding_right_mm,
    padding_bottom_mm: column.padding_bottom_mm,
    padding_left_mm: column.padding_left_mm,
    separator_left: column.separator_left,
    separator_right: column.separator_right,
  })),
});
