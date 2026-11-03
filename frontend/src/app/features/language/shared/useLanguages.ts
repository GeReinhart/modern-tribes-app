import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from './errorMessage.ts';
import { languageService } from './service.ts';
import { Language } from './types.ts';

// The project's available languages (code, display name, theme color) -- replaces the old
// hardcoded fr/en/de list, and doubles as the source for each language's theme color wherever
// a word is displayed. Fetched once by whichever screen needs it; pass the result down rather
// than calling this again per word, to avoid one request per rendered word.
export function useLanguages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setLanguages(await languageService.listLanguages());
      setError(null);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { languages, loading, error, refetch };
}
