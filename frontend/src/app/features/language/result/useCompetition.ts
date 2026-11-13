import { resultService } from './service.ts';
import { CompetitionMember } from './types.ts';
import { LoadedResult, useLoadedResult } from './useLoadedResult.ts';

const NO_MEMBERS: CompetitionMember[] = [];

// The overall score history of everyone who answered the lesson's test.
export function useCompetition(lessonId: string): LoadedResult<CompetitionMember[]> {
  return useLoadedResult(() => resultService.getCompetition(lessonId).then((c) => c.members), NO_MEMBERS, [lessonId]);
}
