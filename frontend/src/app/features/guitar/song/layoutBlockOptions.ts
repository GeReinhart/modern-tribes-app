import { SelectOption } from '@/app/platform/core/common.types.ts';
import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { TFunction } from 'i18next';

import { LayoutAlign, LayoutBlockType } from './types.ts';

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

export const availableBlockOptions = (
  t: TFunction, usedElsewhere: Set<string>, currentValues: LayoutBlockType[],
): SelectOption[] =>
  ALL_BLOCK_TYPES
    .filter((blockType) => currentValues.includes(blockType) || !usedElsewhere.has(blockType))
    .map((blockType) => ({ value: blockType, label: blockTypeLabel(t, blockType) }));
