import { Theme, predefinedThemes } from '@/components/themes/themes';

import React, { ReactNode, createContext, useContext, useState } from 'react';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeKeyOrTheme: string | Theme) => void;
  currentThemeKey: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: ReactNode;
  defaultTheme?: string | Theme;
}> = ({ children, defaultTheme = 'default' }) => {
  const [currentThemeKey, setCurrentThemeKey] = useState<string>(
    typeof defaultTheme === 'string' ? defaultTheme : 'custom',
  );

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof defaultTheme === 'string') {
      return predefinedThemes[defaultTheme] || predefinedThemes.default;
    }
    return defaultTheme;
  });

  const setTheme = (themeKeyOrTheme: string | Theme) => {
    if (typeof themeKeyOrTheme === 'string') {
      const predefinedTheme = predefinedThemes[themeKeyOrTheme];
      if (predefinedTheme) {
        setThemeState(predefinedTheme);
        setCurrentThemeKey(themeKeyOrTheme);
      }
    } else {
      setThemeState(themeKeyOrTheme);
      setCurrentThemeKey(themeKeyOrTheme.id || 'custom');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
