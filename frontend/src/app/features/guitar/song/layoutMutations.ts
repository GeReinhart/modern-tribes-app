import {
  draftBlockFromCopy, draftColumnFromCopy, draftColumnsFromRow, draftColumnsToInput, DraftBlock, DraftColumn,
  emptyDraftBlock, emptyDraftColumn, emptyDraftSpacerColumn, ROW_WIDTH_TWELFTHS,
} from './layoutDraft.ts';
import { GuitarSongLayoutRow, GuitarSongLayoutRowInput, LayoutBlockType, MoveDirection } from './types.ts';
import { CopiedBlock } from './useSongBlockClipboard.ts';

// New columns default to this width rather than claiming all the leftover room, so there's
// still slack left for whatever gets added next.
const NEW_COLUMN_DEFAULT_WIDTH_TWELFTHS = 3;

const sumColumnWidths = (columns: DraftColumn[]): number =>
  columns.reduce((sum, column) => sum + column.width_twelfths, 0);

// Columns are never rebalanced against each other -- resizing, adding, or removing one column
// leaves every other column's width exactly as the user set it. Unused row width is fine; it's
// just blank space a future column or a wider existing one can claim later.
export const remainingRowWidthTwelfths = (row: GuitarSongLayoutRow): number =>
  ROW_WIDTH_TWELFTHS - sumColumnWidths(draftColumnsFromRow(row));

export const toRowInput = (row: GuitarSongLayoutRow): GuitarSongLayoutRowInput =>
  draftColumnsToInput(row.page_break_before, draftColumnsFromRow(row));

export const togglePageBreak = (row: GuitarSongLayoutRow): GuitarSongLayoutRowInput =>
  draftColumnsToInput(!row.page_break_before, draftColumnsFromRow(row));

const addColumnIfRoom = (
  row: GuitarSongLayoutRow, buildColumn: (widthTwelfths: number) => DraftColumn,
): GuitarSongLayoutRowInput => {
  const columns = draftColumnsFromRow(row);
  const remaining = ROW_WIDTH_TWELFTHS - sumColumnWidths(columns);
  if (remaining < 1) return draftColumnsToInput(row.page_break_before, columns);
  const newColumn = buildColumn(Math.min(remaining, NEW_COLUMN_DEFAULT_WIDTH_TWELFTHS));
  return draftColumnsToInput(row.page_break_before, [...columns, newColumn]);
};

export const addColumn = (row: GuitarSongLayoutRow, blockType: LayoutBlockType): GuitarSongLayoutRowInput =>
  addColumnIfRoom(row, (widthTwelfths) => emptyDraftColumn(blockType, widthTwelfths));

// A plain spacer column with no blocks at all -- purely to create horizontal space, with
// elements addable to it later from its own "add element" picker.
export const addEmptyColumn = (row: GuitarSongLayoutRow): GuitarSongLayoutRowInput =>
  addColumnIfRoom(row, emptyDraftSpacerColumn);

// A new column pre-filled with whatever is currently copied, instead of an empty block of a
// chosen type -- the same paste already offered into an existing column, but for a brand new one.
export const pasteToNewColumn = (row: GuitarSongLayoutRow, copied: CopiedBlock): GuitarSongLayoutRowInput =>
  addColumnIfRoom(row, (widthTwelfths) => draftColumnFromCopy(copied, widthTwelfths));

export const removeColumn = (row: GuitarSongLayoutRow, columnId: string): GuitarSongLayoutRowInput => {
  const remaining = draftColumnsFromRow(row).filter((column) => column.key !== columnId);
  return draftColumnsToInput(row.page_break_before, remaining);
};

export const moveColumn = (
  row: GuitarSongLayoutRow, columnId: string, direction: MoveDirection,
): GuitarSongLayoutRowInput => {
  const columns = draftColumnsFromRow(row);
  const index = columns.findIndex((column) => column.key === columnId);
  const targetIndex = direction === 'prev' ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= columns.length) {
    return draftColumnsToInput(row.page_break_before, columns);
  }
  [columns[index], columns[targetIndex]] = [columns[targetIndex], columns[index]];
  return draftColumnsToInput(row.page_break_before, columns);
};

const mapColumn = (
  row: GuitarSongLayoutRow, columnId: string, transform: (column: DraftColumn) => DraftColumn,
): GuitarSongLayoutRowInput => {
  const columns = draftColumnsFromRow(row).map((column) => (column.key === columnId ? transform(column) : column));
  return draftColumnsToInput(row.page_break_before, columns);
};

export const addBlock = (
  row: GuitarSongLayoutRow, columnId: string, blockType: LayoutBlockType,
): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => ({ ...column, blocks: [...column.blocks, emptyDraftBlock(blockType)] }));

export const pasteBlock = (
  row: GuitarSongLayoutRow, columnId: string, copied: CopiedBlock,
): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => ({ ...column, blocks: [...column.blocks, draftBlockFromCopy(copied)] }));

export const moveBlock = (
  row: GuitarSongLayoutRow, columnId: string, blockIndex: number, direction: MoveDirection,
): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => {
    const targetIndex = direction === 'prev' ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= column.blocks.length) return column;
    const blocks = [...column.blocks];
    [blocks[blockIndex], blocks[targetIndex]] = [blocks[targetIndex], blocks[blockIndex]];
    return { ...column, blocks };
  });

export const removeBlock = (row: GuitarSongLayoutRow, columnId: string, blockIndex: number): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => ({ ...column, blocks: column.blocks.filter((_, i) => i !== blockIndex) }));

export const updateColumnPresentation = (
  row: GuitarSongLayoutRow, columnId: string, patch: Partial<Pick<DraftColumn,
    'align' | 'padding_top_mm' | 'padding_right_mm' | 'padding_bottom_mm' | 'padding_left_mm' | 'separator_left' | 'separator_right'>>,
): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => ({ ...column, ...patch }));

export const resizeColumnWidth = (
  row: GuitarSongLayoutRow, columnId: string, deltaTwelfths: number,
): GuitarSongLayoutRowInput => {
  const columns = draftColumnsFromRow(row);
  const index = columns.findIndex((column) => column.key === columnId);
  if (index === -1) return draftColumnsToInput(row.page_break_before, columns);
  const othersWidth = sumColumnWidths(columns) - columns[index].width_twelfths;
  const maxWidth = ROW_WIDTH_TWELFTHS - othersWidth;
  const newWidth = Math.max(1, Math.min(columns[index].width_twelfths + deltaTwelfths, maxWidth));
  columns[index] = { ...columns[index], width_twelfths: newWidth };
  return draftColumnsToInput(row.page_break_before, columns);
};

export const updateBlockPresentation = (
  row: GuitarSongLayoutRow, columnId: string, blockIndex: number,
  patch: Partial<Pick<DraftBlock,
    'zoom_percent' | 'show_card' | 'width_twelfths' | 'title_heading_level'
    | 'padding_top_mm' | 'padding_right_mm' | 'padding_bottom_mm' | 'padding_left_mm'>>,
): GuitarSongLayoutRowInput =>
  mapColumn(row, columnId, (column) => ({
    ...column,
    blocks: column.blocks.map((block, i) => (i === blockIndex ? { ...block, ...patch } : block)),
  }));

export const newRowInput = (blockType: LayoutBlockType): GuitarSongLayoutRowInput =>
  draftColumnsToInput(false, [emptyDraftColumn(blockType, ROW_WIDTH_TWELFTHS)]);

// A row with a single spacer column and no blocks at all -- pure vertical spacing, or a
// starting point to add columns/elements into later from the row's own column menu.
export const newEmptyRowInput = (): GuitarSongLayoutRowInput =>
  draftColumnsToInput(false, [emptyDraftSpacerColumn(ROW_WIDTH_TWELFTHS)]);
