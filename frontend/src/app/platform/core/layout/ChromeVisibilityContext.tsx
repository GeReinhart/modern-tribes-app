import { usePersistedBoolean } from '@/app/platform/core/browser/usePersistedBoolean.ts';

import React, { createContext, useContext } from 'react';

const STORAGE_KEY = 'app-chrome-hidden';

interface ChromeVisibilityContextType {
  chromeHidden: boolean;
  toggleChromeHidden: () => void;
}

const ChromeVisibilityContext = createContext<ChromeVisibilityContextType>({
  chromeHidden: false,
  toggleChromeHidden: () => {},
});

export const ChromeVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chromeHidden, toggleChromeHidden] = usePersistedBoolean(STORAGE_KEY);

  return (
    <ChromeVisibilityContext.Provider value={{ chromeHidden, toggleChromeHidden }}>
      {children}
    </ChromeVisibilityContext.Provider>
  );
};

export const useChromeVisibility = () => useContext(ChromeVisibilityContext);
