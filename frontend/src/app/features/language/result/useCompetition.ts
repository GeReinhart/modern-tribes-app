import { resultService } from './service.ts';
import { CompetitionMember } from './types.ts';
import { LoadedResult, useLoadedResult } from './useLoadedResult.ts';

const NO_MEMBERS: CompetitionMember[] = [];

// The overall score history of everyone who answered the lesson's test and takes part in the competition;
// reloaded when `refreshKey` changes (the user joined or left).
export function useCompetition(lessonId: string, refreshKey: string): LoadedResult<CompetitionMember[]> {
  return useLoadedResult(() => resultService.getCompetition(lessonId).then((c) => c.members), NO_MEMBERS, [lessonId, refreshKey]);
}
