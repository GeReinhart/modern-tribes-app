import { useEffect, useState } from 'react';

import { dashboardDirectoryService } from './dashboardDirectory.service.ts';
import type { DashboardDirectoryResponse } from './dashboardDirectory.types.ts';

export function useDashboardDirectory() {
  const [data, setData] = useState<DashboardDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardDirectoryService.get()
      .then((result) => { if (!cancelled) setData(result); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
