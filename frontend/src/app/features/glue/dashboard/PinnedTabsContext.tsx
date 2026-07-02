import React, { createContext, useContext } from 'react';

import { usePinnedTabs } from './usePinnedTabs.ts';
import { PinnedTab } from './pinnedTabs.types.ts';

interface PinnedTabsContextValue {
  pinnedTabs: PinnedTab[];
  isLoading: boolean;
  pin: (bookmarkId: string) => Promise<PinnedTab>;
  unpin: (pinnedTabId: string) => Promise<void>;
  isPinned: (bookmarkId: string) => boolean;
  getPinnedTabId: (bookmarkId: string) => string | undefined;
}

const PinnedTabsContext = createContext<PinnedTabsContextValue | null>(null);

export const PinnedTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = usePinnedTabs();
  return <PinnedTabsContext.Provider value={value}>{children}</PinnedTabsContext.Provider>;
};

export function usePinnedTabsContext(): PinnedTabsContextValue {
  const ctx = useContext(PinnedTabsContext);
  if (!ctx) throw new Error('usePinnedTabsContext must be used inside PinnedTabsProvider');
  return ctx;
}
