import { useEffect, useState } from 'react';

import { resultService } from './service.ts';
import { CompetitionMember } from './types.ts';

// The overall score history of every project member who answered the lesson's test.
export function useCompetition(lessonId: string): CompetitionMember[] {
  const [members, setMembers] = useState<CompetitionMember[]>([]);

  useEffect(() => {
    resultService.getCompetition(lessonId).then((result) => setMembers(result.members)).catch(() => setMembers([]));
  }, [lessonId]);

  return members;
}
