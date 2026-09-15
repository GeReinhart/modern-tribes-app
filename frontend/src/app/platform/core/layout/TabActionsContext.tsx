import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { createContext, useContext, useState } from 'react';

interface TabActionsContextValue {
  tabActionsFromTab: MenuAction[];
  setTabActionsFromTab: (actions: MenuAction[]) => void;
  // Stable identifier for the active tab's *type* (e.g. a feature type, or a dashboard tab key),
  // passed in by the tab container (ShowProjectPage, DashboardPage) as it already knows which
  // tab is active — individual tabs stay unaware of it. Used to key the per-tab-type toolbar
  // configuration in localStorage. A standalone page (no provider ancestor, so this is null)
  // falls back to a key derived from its own route instead -- see useAppLayoutState.
  tabTypeKey: string | null;
}

const TabActionsContext = createContext<TabActionsContextValue>({
  tabActionsFromTab: [],
  setTabActionsFromTab: () => {},
  tabTypeKey: null,
});

interface TabActionsProviderProps {
  children: React.ReactNode;
  tabTypeKey?: string | null;
}

export const TabActionsProvider: React.FC<TabActionsProviderProps> = ({
  children, tabTypeKey = null,
}) => {
  const [tabActionsFromTab, setTabActionsFromTab] = useState<MenuAction[]>([]);
  return (
    <TabActionsContext.Provider value={{ tabActionsFromTab, setTabActionsFromTab, tabTypeKey }}>
      {children}
    </TabActionsContext.Provider>
  );
};

export const useTabActionsContext = () => useContext(TabActionsContext);
