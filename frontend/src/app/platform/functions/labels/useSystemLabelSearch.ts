import { labelService } from '@/app/platform/functions/labels/label.service.ts';

import { useEffect, useState } from 'react';

export interface SystemLabelSuggestion {
  id: string;
  name: string;
  color: string;
}

const DEBOUNCE_MS = 250;

export function useSystemLabelSearch(query: string): SystemLabelSuggestion[] {
  const [results, setResults] = useState<SystemLabelSuggestion[]>([]);

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
