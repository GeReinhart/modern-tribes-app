import { resultService } from './service.ts';
import { ScoreHistoryPoint } from './types.ts';
import { LoadedResult, useLoadedResult } from './useLoadedResult.ts';

const NO_POINTS: ScoreHistoryPoint[] = [];

// The lesson's overall score day by day for one person (the signed-in user when `userId` is omitted).
export function useScoreHistory(lessonId: string, userId?: string): LoadedResult<ScoreHistoryPoint[]> {
  return useLoadedResult(() => resultService.getScoreHistory(lessonId, userId).then((h) => h.points), NO_POINTS, [lessonId, userId]);
}
