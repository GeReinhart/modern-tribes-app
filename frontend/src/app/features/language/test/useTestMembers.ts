import { useEffect, useState } from 'react';

import { testService } from './service.ts';
import { TestMember } from './types.ts';

export function useTestMembers(lessonId: string) {
  const [members, setMembers] = useState<TestMember[]>([]);

  useEffect(() => {
    testService.getMembers(lessonId).then(setMembers).catch(() => setMembers([]));
  }, [lessonId]);

  return members;
}
