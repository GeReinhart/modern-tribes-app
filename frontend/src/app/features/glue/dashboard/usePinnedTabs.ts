import { useCallback, useEffect, useState } from 'react';

import { PinnedTab } from './pinnedTabs.types.ts';
import { pinnedTabsService } from './pinnedTabs.service.ts';

interface UsePinnedTabsResult {
  pinnedTabs: PinnedTab[];
  isLoading: boolean;
  pin: (bookmarkId: string) => Promise<PinnedTab>;
  unpin: (pinnedTabId: string) => Promise<void>;
  isPinned: (bookmarkId: string) => boolean;
  getPinnedTabId: (bookmarkId: string) => string | undefined;
}

export function usePinnedTabs(): UsePinnedTabsResult {
  const [pinnedTabs, setPinnedTabs] = useState<PinnedTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    pinnedTabsService
      .list()
      .then((resp) => {
        if (!cancelled) setPinnedTabs(resp.pinned_tabs);
      })
      .catch(() => {
        if (!cancelled) setPinnedTabs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pin = useCallback(async (bookmarkId: string): Promise<PinnedTab> => {
    const created = await pinnedTabsService.pin({ bookmark_id: bookmarkId });
    setPinnedTabs((prev) => [...prev, created]);
    return created;
  }, []);

  const unpin = useCallback(async (pinnedTabId: string): Promise<void> => {
    await pinnedTabsService.unpin(pinnedTabId);
    setPinnedTabs((prev) => prev.filter((t) => t.id !== pinnedTabId));
  }, []);

  const isPinned = useCallback(
    (bookmarkId: string): boolean => pinnedTabs.some((t) => t.bookmark_id === bookmarkId),
    [pinnedTabs],
  );

  const getPinnedTabId = useCallback(
    (bookmarkId: string): string | undefined =>
      pinnedTabs.find((t) => t.bookmark_id === bookmarkId)?.id,
    [pinnedTabs],
  );

  return { pinnedTabs, isLoading, pin, unpin, isPinned, getPinnedTabId };
}
