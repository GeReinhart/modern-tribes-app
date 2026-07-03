import { useMemo, useState } from 'react';

export interface TribeTagged {
  tribe_url_param_id: string;
  tribe_name: string;
}

export interface TribeOption {
  tribe_url_param_id: string;
  tribe_name: string;
}

function collectTribeOptions(entries: TribeTagged[]): TribeOption[] {
  const seen = new Map<string, string>();
  entries.forEach((entry) => {
    if (!seen.has(entry.tribe_url_param_id)) {
      seen.set(entry.tribe_url_param_id, entry.tribe_name);
    }
  });
  return Array.from(seen, ([tribe_url_param_id, tribe_name]) => ({ tribe_url_param_id, tribe_name }))
    .sort((a, b) => a.tribe_name.localeCompare(b.tribe_name));
}

export function useTribeFilter<T extends TribeTagged>(entries: T[]) {
  const [selectedTribeIds, setSelectedTribeIds] = useState<Set<string>>(new Set());

  const tribeOptions = useMemo(() => collectTribeOptions(entries), [entries]);

  const toggleTribe = (tribeUrlParamId: string) => {
    setSelectedTribeIds((prev) => {
      const next = new Set(prev);
      if (next.has(tribeUrlParamId)) {
        next.delete(tribeUrlParamId);
      } else {
        next.add(tribeUrlParamId);
      }
      return next;
    });
  };

  const filteredEntries = useMemo(() => {
    if (selectedTribeIds.size === 0) return entries;
    return entries.filter((entry) => selectedTribeIds.has(entry.tribe_url_param_id));
  }, [entries, selectedTribeIds]);

  return { tribeOptions, selectedTribeIds, toggleTribe, filteredEntries };
}
