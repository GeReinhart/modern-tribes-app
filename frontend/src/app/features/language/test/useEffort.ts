import { useEffect, useState } from 'react';

import { testService } from './service.ts';
import { EffortDay } from './types.ts';

// The lesson's weighted successes and errors day by day for one person (the signed-in user when `userId` is omitted).
export function useEffort(lessonId: string, userId?: string): EffortDay[] {
  const [days, setDays] = useState<EffortDay[]>([]);

  useEffect(() => {
    testService.getEffort(lessonId, userId).then((effort) => setDays(effort.days)).catch(() => setDays([]));
  }, [lessonId, userId]);

  return days;
}
