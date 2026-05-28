import { userDisplayService } from '@/services/user-display.service';
import { UserDisplayInfo } from '@/types/user-display.types';

import { useEffect, useState } from 'react';

const cache = new Map<string, UserDisplayInfo>();

export function useUserDisplayInfo(userId: string | null): {
  info: UserDisplayInfo | null;
  loading: boolean;
} {
  const [info, setInfo] = useState<UserDisplayInfo | null>(
    userId && cache.has(userId) ? (cache.get(userId) ?? null) : null,
  );
  const [loading, setLoading] = useState(userId !== null && !cache.has(userId ?? ''));

  useEffect(() => {
    if (!userId) return;
    if (cache.has(userId)) {
      setInfo(cache.get(userId) ?? null);
      setLoading(false);
      return;
    }
    setLoading(true);
    userDisplayService
      .getDisplayInfo(userId)
      .then((data) => {
        cache.set(userId, data);
        setInfo(data);
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return { info, loading };
}
