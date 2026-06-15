import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { createContext, useContext, useState } from 'react';

interface TabActionsContextValue {
  tabActionsFromTab: MenuAction[];
  setTabActionsFromTab: (actions: MenuAction[]) => void;
}

const TabActionsContext = createContext<TabActionsContextValue>({
  tabActionsFromTab: [],
  setTabActionsFromTab: () => {},
});

export const TabActionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabActionsFromTab, setTabActionsFromTab] = useState<MenuAction[]>([]);
  return (
    <TabActionsContext.Provider value={{ tabActionsFromTab, setTabActionsFromTab }}>
      {children}
    </TabActionsContext.Provider>
  );
};

export const useTabActionsContext = () => useContext(TabActionsContext);
