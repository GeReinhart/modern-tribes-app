import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from './errorMessage.ts';
import { languageService } from './service.ts';
import { LessonDetail } from './types.ts';

// Shared by the lesson, learn and test tabs: all three need a lesson's document content and
// full word list (the word list doubles as the quiz's word pool in the test tab).
export function useLessonDetail(lessonId: string | null) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      setDetail(await languageService.getLessonDetail(lessonId));
      setError(null);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    setDetail(null);
    refetch();
  }, [refetch]);

  return { detail, loading, error, refetch };
}
