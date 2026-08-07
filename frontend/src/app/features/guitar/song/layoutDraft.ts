import { isTitleEditableBlockType } from './layoutBlockOptions.ts';
import {
  GuitarSongLayoutBlockInput,
  GuitarSongLayoutColumnInput,
  GuitarSongLayoutRow,
  GuitarSongLayoutRowInput,
  LayoutAlign,
  LayoutBlockType,
  TitleHeadingLevel,
} from './types.ts';

export const CUSTOM_BLOCK_TYPE: LayoutBlockType = 'custom';

export interface DraftBlock {
  key: string;
  block_type: LayoutBlockType;
  width_eighths: number;
  zoom_percent: number;
  show_card: boolean;
  title_heading_level: TitleHeadingLevel;
  // null means "use the block type's default label/no title"; '' means explicitly removed
  // (only meaningful for title-editable and custom block types) -- these must stay distinct,
  // never collapsed into each other, or clearing a title would look identical to never having
  // set one and vice versa.
  custom_title: string | null;
  custom_content_html: string;
}

export interface DraftColumn {
  key: string;
  blocks: DraftBlock[];
  width_eighths: number;
  align: LayoutAlign;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
}

export const ROW_WIDTH_EIGHTHS = 8;
export const DEFAULT_ZOOM_PERCENT = 100;
const DEFAULT_CARD_BLOCK_TYPES = new Set<LayoutBlockType>(['description', 'chords', 'videos', 'custom']);

// A sensible starting width per element, so a freshly added block doesn't always claim the
// whole row — the user can still resize it afterward from its own presentation menu.
const DEFAULT_BLOCK_WIDTH_EIGHTHS: Partial<Record<LayoutBlockType, number>> = {
  title: 3,
  author: 3,
  tempo: 2,
  time_signature: 1,
  capo: 1,
  description: 6,
  chords: 6,
  sections: 8,
  videos: 4,
  labels: 4,
};

export const emptyDraftBlock = (blockType: LayoutBlockType): DraftBlock => ({
  key: crypto.randomUUID(),
  block_type: blockType,
  width_eighths: DEFAULT_BLOCK_WIDTH_EIGHTHS[blockType] ?? ROW_WIDTH_EIGHTHS,
  zoom_percent: DEFAULT_ZOOM_PERCENT,
  show_card: DEFAULT_CARD_BLOCK_TYPES.has(blockType),
  title_heading_level: 'h3',
  custom_title: null,
  custom_content_html: '',
});

export const emptyDraftColumn = (blockType: LayoutBlockType, widthEighths: number): DraftColumn => ({
  key: crypto.randomUUID(),
  blocks: [emptyDraftBlock(blockType)],
  width_eighths: widthEighths,
  align: 'left',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
});

// A column with no blocks at all -- a plain spacer that just claims some of the row's width.
// Elements can still be added to it later from its own "add element" picker.
export const emptyDraftSpacerColumn = (widthEighths: number): DraftColumn => ({
  key: crypto.randomUUID(),
  blocks: [],
  width_eighths: widthEighths,
  align: 'left',
  padding_top_mm: 0,
  padding_right_mm: 0,
  padding_bottom_mm: 0,
  padding_left_mm: 0,
});

export const draftColumnsFromRow = (row: GuitarSongLayoutRow): DraftColumn[] =>
  [...row.columns].sort((a, b) => a.position - b.position).map((column): DraftColumn => ({
    key: column.id,
    blocks: column.blocks.map((block, index): DraftBlock => ({
      key: `${column.id}-${index}`,
      block_type: block.block_type,
      width_eighths: block.width_eighths,
      zoom_percent: block.zoom_percent,
      show_card: block.show_card,
      title_heading_level: block.title_heading_level,
      custom_title: block.custom_title,
      custom_content_html: block.custom_content_html ?? '',
    })),
    width_eighths: column.width_eighths,
    align: column.align,
    padding_top_mm: column.padding_top_mm,
    padding_right_mm: column.padding_right_mm,
    padding_bottom_mm: column.padding_bottom_mm,
    padding_left_mm: column.padding_left_mm,
  }));

export const draftColumnsToInput = (
  pageBreakBefore: boolean, columns: DraftColumn[],
): GuitarSongLayoutRowInput => ({
  page_break_before: pageBreakBefore,
  columns: columns.map((column): GuitarSongLayoutColumnInput => ({
    blocks: column.blocks.map((block): GuitarSongLayoutBlockInput => ({
      block_type: block.block_type,
      width_eighths: block.width_eighths,
      zoom_percent: block.zoom_percent,
      show_card: block.show_card,
      title_heading_level: block.title_heading_level,
      custom_title: block.block_type === CUSTOM_BLOCK_TYPE || isTitleEditableBlockType(block.block_type) ? block.custom_title : null,
      custom_content_html: block.block_type === CUSTOM_BLOCK_TYPE ? block.custom_content_html : null,
    })),
    width_eighths: column.width_eighths,
    align: column.align,
    padding_top_mm: column.padding_top_mm,
    padding_right_mm: column.padding_right_mm,
    padding_bottom_mm: column.padding_bottom_mm,
    padding_left_mm: column.padding_left_mm,
  })),
});
