import { useCallback, useEffect, useState } from 'react';

import { quickAddDefaultsService } from './quickAddDefaults.service.ts';
import type { QuickAddDefaultEntry, QuickAddDefaultsResponse } from './quickAddDefaults.types.ts';

export function resolveQuickAddDefault(entry: QuickAddDefaultEntry | undefined): string | null {
  return entry?.feature_instance_id ?? null;
}

export function useQuickAddDefaults() {
  const [data, setData] = useState<QuickAddDefaultsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setData(await quickAddDefaultsService.get());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
