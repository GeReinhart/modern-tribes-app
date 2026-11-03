import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '../shared/errorMessage.ts';
import { languageService } from '../shared/service.ts';
import { LanguageSettings } from '../shared/types.ts';

// `settings === null` means no pair has been set yet for this project (not an error).
export function useLanguageSettings(projectId: string) {
  const [settings, setSettings] = useState<LanguageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await languageService.getSettings(projectId));
      setError(null);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setPair = useCallback(async (sourceLanguage: string, targetLanguage: string): Promise<boolean> => {
    try {
      setSettings(await languageService.setSettings(projectId, {
        source_language: sourceLanguage, target_language: targetLanguage,
      }));
      setError(null);
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [projectId]);

  return { settings, loading, error, setPair };
}
