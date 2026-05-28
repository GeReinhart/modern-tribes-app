import { labelService } from '@/services/label.service';

import { useEffect, useState } from 'react';

import type { TaskLabelInfo } from './types';

const DEBOUNCE_MS = 250;

export function useSystemLabelSearch(query: string): TaskLabelInfo[] {
  const [results, setResults] = useState<TaskLabelInfo[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rows = await labelService.searchFeatureLabels(query.trim());
        if (!cancelled) setResults(rows);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return results;
}
