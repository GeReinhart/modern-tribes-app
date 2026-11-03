import { useEffect, useState } from 'react';

import { languageService } from './service.ts';
import { WordSummary } from './types.ts';
import { useDebouncedValue } from './useDebouncedValue.ts';

// Debounced dictionary search, driven by a caller-controlled text value rather than owning its
// own input -- used by each column of the word form so the search box doubles as the word's
// own text field.
export function useWordSearch(searchText: string, language?: string) {
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const [results, setResults] = useState<WordSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = debouncedSearch.trim();
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    languageService.searchWords(query, language)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, language]);

  return { results, loading };
}
