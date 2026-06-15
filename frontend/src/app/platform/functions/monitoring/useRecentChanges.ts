import { monitoringService } from '@/app/platform/functions/monitoring/monitoring.service.ts';
import { RecentChange } from '@/app/platform/functions/monitoring/monitoring.types.ts';

import { useCallback, useEffect, useState } from 'react';

export const useRecentChanges = (
  hours: number,
  userEmail?: string,
  status?: string,
) => {
  const [data, setData] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await monitoringService.getRecentChanges(
        hours,
        userEmail,
        status,
      );
      setData(result);
      setError(null);
    } catch {
      setError('Failed to load recent changes');
    } finally {
      setLoading(false);
    }
  }, [hours, userEmail, status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
