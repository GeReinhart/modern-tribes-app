import { notificationService } from '@/app/platform/tools/notifications/notification.service.ts';
import { UserSearchResult } from '@/app/platform/tools/notifications/notification.types.ts';

import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

export function useUserSearch(query: string) {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await notificationService.searchUsers(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { results, loading };
}
