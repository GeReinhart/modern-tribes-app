import { useEffect, useState } from 'react';

import { resultService } from './service.ts';
import { ResultMember } from './types.ts';

export function useResultMembers(lessonId: string) {
  const [members, setMembers] = useState<ResultMember[]>([]);

  useEffect(() => {
    resultService.getMembers(lessonId).then(setMembers).catch(() => setMembers([]));
  }, [lessonId]);

  return members;
}
