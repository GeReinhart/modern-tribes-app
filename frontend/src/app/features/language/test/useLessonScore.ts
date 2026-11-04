import { useCallback, useEffect, useState } from 'react';

import { testService } from './service.ts';
import { LessonScoreResponse } from './types.ts';

// Each lesson row fetches its own score independently on mount, so the list renders
// immediately and scores fill in as they arrive instead of blocking on all of them at once.
export function useLessonScore(lessonId: string) {
  const [scoreData, setScoreData] = useState<LessonScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setScoreData(await testService.getScore(lessonId));
    } catch {
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { scoreData, loading, refetch };
}
