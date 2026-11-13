import { useCallback, useEffect, useState } from 'react';

import { resultService } from './service.ts';

export interface CompetitionParticipationState {
  // Null until the choice is known.
  participates: boolean | null;
  toggle: () => void;
}

// Whether the signed-in user takes part in the project's competition, and a way to flip the choice.
export function useCompetitionParticipation(lessonId: string): CompetitionParticipationState {
  const [participates, setParticipates] = useState<boolean | null>(null);

  useEffect(() => {
    resultService.getParticipation(lessonId).then((p) => setParticipates(p.participates)).catch(() => setParticipates(null));
  }, [lessonId]);

  const toggle = useCallback(() => {
    if (participates === null) return;
    resultService.setParticipation(lessonId, !participates).then((p) => setParticipates(p.participates)).catch(() => undefined);
  }, [lessonId, participates]);

  return { participates, toggle };
}
