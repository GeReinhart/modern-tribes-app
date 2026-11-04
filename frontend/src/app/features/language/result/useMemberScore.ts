import { useEffect, useState } from 'react';

import { resultService } from './service.ts';
import { LessonScoreResponse } from '../shared/scoreTypes.ts';

// A project member's score on the lesson, word by word (the signed-in user when `userId` is omitted).
export function useMemberScore(lessonId: string, userId?: string): LessonScoreResponse | null {
  const [scoreData, setScoreData] = useState<LessonScoreResponse | null>(null);

  useEffect(() => {
    resultService.getScore(lessonId, userId).then(setScoreData).catch(() => setScoreData(null));
  }, [lessonId, userId]);

  return scoreData;
}
