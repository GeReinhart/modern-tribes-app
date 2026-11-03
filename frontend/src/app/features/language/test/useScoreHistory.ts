import { useEffect, useState } from 'react';

import { testService } from './service.ts';
import { ScoreHistoryPoint } from './types.ts';

// The lesson's overall score day by day for one person (the signed-in user when `userId` is omitted).
export function useScoreHistory(lessonId: string, userId?: string): ScoreHistoryPoint[] {
  const [points, setPoints] = useState<ScoreHistoryPoint[]>([]);

  useEffect(() => {
    testService.getScoreHistory(lessonId, userId).then((history) => setPoints(history.points)).catch(() => setPoints([]));
  }, [lessonId, userId]);

  return points;
}
