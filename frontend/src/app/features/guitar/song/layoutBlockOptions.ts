import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { TFunction } from 'i18next';

import {
  GuitarSongLayoutBlock, GuitarSongLayoutRow, LayoutAlign, LayoutBlockType, TitleHeadingLevel,
} from './types.ts';

export const ALL_BLOCK_TYPES: LayoutBlockType[] = [
  'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', 'labels',
  'chord_grid',
];

export const ALL_ALIGNS: LayoutAlign[] = ['left', 'center', 'right'];

// Compact blocks (small stat cards) flow side by side within a column instead of each
// claiming a full row — e.g. tempo, time signature and capo sit together like the old
// combined "stats" block used to.
const COMPACT_BLOCK_TYPES = new Set<LayoutBlockType>(['tempo', 'time_signature', 'capo']);

export const isCompactBlockType = (blockType: LayoutBlockType): boolean => COMPACT_BLOCK_TYPES.has(blockType);

// These block types show an editable title above their content, via the block's own
// custom_title (same field a custom/free-text block uses for its title) -- chords/chord_grid
// default to a translated heading (e.g. "Chords") when unset, the others default to
// no title at all until the user names them. title/author/tempo/time_signature/capo show the
// song's own value instead of a separate label, so they're never title-editable.
const TITLE_EDITABLE_BLOCK_TYPES = new Set<LayoutBlockType>([
  'chords', 'sections', 'labels', 'description', 'chord_grid',
]);

export const isTitleEditableBlockType = (blockType: LayoutBlockType): boolean => TITLE_EDITABLE_BLOCK_TYPES.has(blockType);

// Mirrors the backend's _DOCUMENT_BACKED_BLOCK_TYPES (layout/service.py) -- a custom block's
// whole body, and a chord grid's comment, are both stored as a document behind
// custom_content_html.
const DOCUMENT_BACKED_BLOCK_TYPES = new Set<LayoutBlockType>(['custom', 'chord_grid']);

export const isDocumentBackedBlockType = (blockType: LayoutBlockType): boolean => DOCUMENT_BACKED_BLOCK_TYPES.has(blockType);

// H5 is a deliberately toned-down option any block type can pick -- non-bold and italic, unlike
// H1-H4 (see SongEditableBlockTitle and the backend's render_block_title).
export const ALL_TITLE_HEADING_LEVELS: TitleHeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5'];

// Mirrors the backend's _HEADING_SIZES_PX in pdf_blocks.py -- keep both in sync.
export const TITLE_HEADING_SIZES_PX: Record<TitleHeadingLevel, number> = { h1: 24, h2: 20, h3: 16, h4: 13, h5: 12 };

// A "Lyrics & Chords" block is repeatable since a song's parts (verse, chorus...) are each their
// own block, not one shared container -- same reason a custom block or a chord grid is
// repeatable: nothing about any of the three is a song-wide singleton. A 'chords' block is
// repeatable for the same reason -- a song may want a "Main chords" block, an "Alternative
// chords" block, an "Outro chords" block, etc.; its overall chord list is simply the
// deduplicated union of every 'chords' block's own list.
const REPEATABLE_BLOCK_TYPES = new Set<LayoutBlockType>(['sections', 'chord_grid', 'chords']);

// Copy/paste is offered only for block types with no song-wide singleton constraint -- pasting a
// second 'title' block elsewhere would collide with the one the song already has ('chords' no
// longer collides now that it's repeatable too).
const COPYABLE_BLOCK_TYPES = new Set<LayoutBlockType>(['sections', 'chord_grid', 'custom', 'chords']);

export const isCopyableBlockType = (blockType: LayoutBlockType): boolean => COPYABLE_BLOCK_TYPES.has(blockType);

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

// Longest text preview shown next to a "Lyrics & Chords" block's name when picking it from a
// dropdown -- enough to recognize a song part at a glance without overflowing the option.
const BLOCK_OPTION_PREVIEW_LENGTH = 40;

const sectionsBlockTextPreview = (block: GuitarSongLayoutBlock): string => {
  const normalized = block.lyrics_text?.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > BLOCK_OPTION_PREVIEW_LENGTH
    ? `${normalized.slice(0, BLOCK_OPTION_PREVIEW_LENGTH)}…`
    : normalized;
};

// A "Lyrics & Chords" block's own name (its title, or a numbered fallback) plus a preview of its
// content -- used when picking one to mirror via linked_to_block_id.
export const sectionsBlockOptionLabel = (t: TFunction, block: GuitarSongLayoutBlock, index: number): string => {
  const title = block.custom_title?.trim() || t('guitarSong.sections.blockOption', { index: index + 1 });
  const preview = sectionsBlockTextPreview(block);
  return preview ? `${title} — ${preview}` : title;
};
