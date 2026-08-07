import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { TFunction } from 'i18next';

import { GuitarSongLayoutBlock, GuitarSongLayoutRow, LayoutAlign, LayoutBlockType, TitleHeadingLevel } from './types.ts';

export const ALL_BLOCK_TYPES: LayoutBlockType[] = [
  'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', 'videos', 'labels',
];

export const ALL_ALIGNS: LayoutAlign[] = ['left', 'center', 'right'];

// Compact blocks (small stat cards) flow side by side within a column instead of each
// claiming a full row — e.g. tempo, time signature and capo sit together like the old
// combined "stats" block used to.
const COMPACT_BLOCK_TYPES = new Set<LayoutBlockType>(['tempo', 'time_signature', 'capo']);

export const isCompactBlockType = (blockType: LayoutBlockType): boolean => COMPACT_BLOCK_TYPES.has(blockType);

// These block types show an editable title above their content, via the block's own
// custom_title (same field a custom/free-text block uses for its title) -- chords/videos
// default to a translated heading (e.g. "Chords") when unset, the others default to no title
// at all until the user names them. title/author/tempo/time_signature/capo show the song's own
// value instead of a separate label, so they're never title-editable.
const TITLE_EDITABLE_BLOCK_TYPES = new Set<LayoutBlockType>(['chords', 'sections', 'videos', 'labels', 'description']);

export const isTitleEditableBlockType = (blockType: LayoutBlockType): boolean => TITLE_EDITABLE_BLOCK_TYPES.has(blockType);

export const ALL_TITLE_HEADING_LEVELS: TitleHeadingLevel[] = ['h1', 'h2', 'h3', 'h4'];

// Mirrors the backend's _HEADING_SIZES_PX in pdf_blocks.py -- keep both in sync.
export const TITLE_HEADING_SIZES_PX: Record<TitleHeadingLevel, number> = { h1: 24, h2: 20, h3: 16, h4: 13 };

// Unlike every other non-custom block type, a song's sections are split across its own "Lyrics
// & Chords" blocks (each section picks which one it belongs to), so several may coexist.
const REPEATABLE_BLOCK_TYPES = new Set<LayoutBlockType>(['sections']);

const ALIGN_ICONS: Record<LayoutAlign, IconName> = {
  left: 'align-left',
  center: 'align-center',
  right: 'align-right',
};

export const blockTypeLabel = (t: TFunction, blockType: LayoutBlockType): string =>
  t(`guitarSong.layout.block.${blockType}`);

export const alignLabel = (t: TFunction, align: LayoutAlign): string =>
  t(`guitarSong.layout.align${align.charAt(0).toUpperCase()}${align.slice(1)}`);

export const alignIcon = (align: LayoutAlign): IconName => ALIGN_ICONS[align];

// A non-custom block type may appear only once per row (enforced by the backend), and by
// convention only once across the whole layout, so this excludes both the given row's own
// blocks and every other row's blocks.
export const usedBlockTypesExcludingRow = (rows: GuitarSongLayoutRow[], excludeRowId?: string): Set<LayoutBlockType> =>
  new Set(
    rows
      .filter((row) => row.id !== excludeRowId)
      .flatMap((row) => row.columns.flatMap((column) => column.blocks.map((block) => block.block_type))),
  );

export const unusedBlockTypes = (rows: GuitarSongLayoutRow[], rowId: string): LayoutBlockType[] => {
  const row = rows.find((r) => r.id === rowId);
  const inRow = row ? row.columns.flatMap((column) => column.blocks.map((block) => block.block_type)) : [];
  const used = new Set([...usedBlockTypesExcludingRow(rows, rowId), ...inRow]);
  return ALL_BLOCK_TYPES.filter((blockType) => REPEATABLE_BLOCK_TYPES.has(blockType) || !used.has(blockType));
};

// A repeatable block type (currently just 'sections') may be added to the SAME column/row it
// already appears in too, unlike unusedBlockTypes' one-and-done non-custom types.
export const isRepeatableBlockType = (blockType: LayoutBlockType): boolean => REPEATABLE_BLOCK_TYPES.has(blockType);

// Every block of a given type across the whole layout, in row/column/position order -- stable
// enough to number them ("Lyrics & Chords #1/#2") for a repeatable type like 'sections'.
export const findBlocksOfType = (rows: GuitarSongLayoutRow[], blockType: LayoutBlockType): GuitarSongLayoutBlock[] =>
  [...rows]
    .sort((a, b) => a.position - b.position)
    .flatMap((row) => [...row.columns].sort((a, b) => a.position - b.position).flatMap((column) => column.blocks))
    .filter((block) => block.block_type === blockType);
