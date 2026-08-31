import { useEffect, useState } from 'react';

export function useLabelFilter(activeLabelIds: Set<string>) {
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  useEffect(() => {
    setFilterLabelIds((prev) => prev.filter((id) => activeLabelIds.has(id)));
  }, [activeLabelIds]);

  const toggleFilterLabel = (id: string) => {
    setFilterLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const matchesLabelFilter = (itemLabelIds: string[]) =>
    filterLabelIds.every((id) => itemLabelIds.includes(id));

  return { filterLabelIds, toggleFilterLabel, matchesLabelFilter };
}
