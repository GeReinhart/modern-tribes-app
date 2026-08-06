// Swaps an item with its immediate neighbor, a no-op past either end of the array -- shared by
// every "move up/down" control over a plain client-side list (a chord grid cell's items, a
// 'chords' block's own chord list...), as opposed to a server-side reorder (rows, videos,
// labels), which swaps positions via position_utils on the backend instead.
export const swapAdjacent = <T,>(items: T[], index: number, direction: 'prev' | 'next'): T[] => {
  const target = direction === 'prev' ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
