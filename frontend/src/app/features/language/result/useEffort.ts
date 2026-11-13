import { resultService } from './service.ts';
import { EffortDay } from './types.ts';
import { LoadedResult, useLoadedResult } from './useLoadedResult.ts';

const NO_DAYS: EffortDay[] = [];

// The lesson's weighted successes and errors day by day for one person (the signed-in user when `userId` is omitted).
export function useEffort(lessonId: string, userId?: string): LoadedResult<EffortDay[]> {
  return useLoadedResult(() => resultService.getEffort(lessonId, userId).then((e) => e.days), NO_DAYS, [lessonId, userId]);
}
