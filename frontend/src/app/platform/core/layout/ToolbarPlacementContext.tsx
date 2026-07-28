import { ToolbarPlacement, TOOLBAR_PLACEMENTS } from '@/app/platform/core/layout/toolbar.types.ts';

import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'app-toolbar-placement';

const loadPlacement = (): ToolbarPlacement => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return TOOLBAR_PLACEMENTS.includes(stored as ToolbarPlacement)
    ? (stored as ToolbarPlacement)
    : 'off';
};

interface ToolbarPlacementContextType {
  toolbarPlacement: ToolbarPlacement;
  setToolbarPlacement: (placement: ToolbarPlacement) => void;
}

const ToolbarPlacementContext = createContext<ToolbarPlacementContextType>({
  toolbarPlacement: 'off',
  setToolbarPlacement: () => {},
});

export const ToolbarPlacementProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toolbarPlacement, setPlacement] = useState<ToolbarPlacement>(loadPlacement);

  const setToolbarPlacement = (placement: ToolbarPlacement) => {
    localStorage.setItem(STORAGE_KEY, placement);
    setPlacement(placement);
  };

  return (
    <ToolbarPlacementContext.Provider value={{ toolbarPlacement, setToolbarPlacement }}>
      {children}
    </ToolbarPlacementContext.Provider>
  );
};

export const useToolbarPlacement = () => useContext(ToolbarPlacementContext);
