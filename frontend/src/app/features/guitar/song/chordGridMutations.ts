import { swapAdjacent } from './arrayMutations.ts';
import { ChordGridCell, ChordGridCellItem } from './types.ts';

// A chord grid is a dense rectangle -- inserting a row/column always creates one new cell per
// existing column/row, so every row keeps the exact same length no matter what's inserted where.
export const emptyChordGridCell = (): ChordGridCell => ({
  border_top: false, border_right: false, border_bottom: false, border_left: false, items: [],
});

export const insertChordGridRow = (rows: ChordGridCell[][], atIndex: number): ChordGridCell[][] => {
  const columnCount = rows[0]?.length ?? 1;
  const newRow = Array.from({ length: columnCount }, emptyChordGridCell);
  const next = [...rows];
  next.splice(atIndex, 0, newRow);
  return next;
};

export const removeChordGridRow = (rows: ChordGridCell[][], rowIndex: number): ChordGridCell[][] =>
  rows.filter((_, index) => index !== rowIndex);

export const insertChordGridColumn = (rows: ChordGridCell[][], atIndex: number): ChordGridCell[][] =>
  rows.map((row) => {
    const next = [...row];
    next.splice(atIndex, 0, emptyChordGridCell());
    return next;
  });

export const removeChordGridColumn = (rows: ChordGridCell[][], columnIndex: number): ChordGridCell[][] =>
  rows.map((row) => row.filter((_, index) => index !== columnIndex));

export const updateChordGridCell = (
  rows: ChordGridCell[][], rowIndex: number, columnIndex: number, patch: Partial<ChordGridCell>,
): ChordGridCell[][] =>
  rows.map((row, r) => (r !== rowIndex ? row : row.map((cell, c) => (c !== columnIndex ? cell : { ...cell, ...patch }))));

export const addChordGridCellItem = (cell: ChordGridCell, item: ChordGridCellItem): ChordGridCell => ({
  ...cell, items: [...cell.items, item],
});

export const removeChordGridCellItem = (cell: ChordGridCell, itemIndex: number): ChordGridCell => ({
  ...cell, items: cell.items.filter((_, index) => index !== itemIndex),
});

export const moveChordGridCellItem = (
  cell: ChordGridCell, itemIndex: number, direction: 'prev' | 'next',
): ChordGridCell => ({ ...cell, items: swapAdjacent(cell.items, itemIndex, direction) });
