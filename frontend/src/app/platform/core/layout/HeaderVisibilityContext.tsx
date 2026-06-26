import React, { createContext, useContext, useState } from 'react';

interface HeaderVisibilityContextType {
  headerVisible: boolean;
  toggleHeader: () => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType>({
  headerVisible: true,
  toggleHeader: () => {},
});

export const HeaderVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const toggleHeader = () => setHeaderVisible((v) => !v);
  return (
    <HeaderVisibilityContext.Provider value={{ headerVisible, toggleHeader }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
};

export const useHeaderVisibility = () => useContext(HeaderVisibilityContext);
