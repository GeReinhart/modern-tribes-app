import { useResponsive } from '@/app/platform/core/responsive/useResponsive.ts';

import React, { ReactNode, createContext, useContext } from 'react';

interface ResponsiveContextType {
  isPhone: boolean;
  isMobile: boolean;
  windowWidth: number;
  zoom: number;
  updateZoom: (zoom: number) => void;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(
  undefined,
);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isPhone, isMobile, windowWidth, zoom, updateZoom } = useResponsive();
  return (
    <ResponsiveContext.Provider value={{ isPhone, isMobile, windowWidth, zoom, updateZoom }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useResponsiveContext = (): ResponsiveContextType => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error(
      'useResponsiveContext must be used within a ResponsiveProvider',
    );
  }
  return context;
};
