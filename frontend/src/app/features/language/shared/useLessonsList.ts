import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from './errorMessage.ts';
import { languageService } from './service.ts';
import { Lesson } from './types.ts';

// Shared by the lesson (write), learn (read) and test (quiz) tabs: they all list the exact
// same project-scoped lessons, so the fetch and its state live here once.
export function useLessonsList(projectId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setLessons(await languageService.listLessons(projectId));
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

  const createLesson = useCallback(async (title: string): Promise<Lesson | null> => {
    try {
      const created = await languageService.createLesson(projectId, title);
      setLessons((prev) => [...prev, created]);
      return created;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return null;
    }
  }, [projectId]);

  return { lessons, loading, error, refetch, createLesson };
}
