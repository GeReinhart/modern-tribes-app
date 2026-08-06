import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { TFunction } from 'i18next';

import { GuitarSongLayoutRow, LayoutAlign, LayoutBlockType } from './types.ts';

export const ALL_BLOCK_TYPES: LayoutBlockType[] = [
  'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', 'videos', 'labels',
];

export const ALL_ALIGNS: LayoutAlign[] = ['left', 'center', 'right'];

// Compact blocks (small stat cards) flow side by side within a column instead of each
// claiming a full row — e.g. tempo, time signature and capo sit together like the old
// combined "stats" block used to.
const COMPACT_BLOCK_TYPES = new Set<LayoutBlockType>(['tempo', 'time_signature', 'capo']);

export const isCompactBlockType = (blockType: LayoutBlockType): boolean => COMPACT_BLOCK_TYPES.has(blockType);

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
  return ALL_BLOCK_TYPES.filter((blockType) => !used.has(blockType));
};
