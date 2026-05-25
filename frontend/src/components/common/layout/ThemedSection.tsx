import { ThemeProvider } from '@/contexts/ThemeContext.tsx';

import React, { ReactNode } from 'react';

import { themesById } from '../../themes/themes.ts';

interface ThemedSectionProps {
  children: ReactNode;
  themeId?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const ThemedSection: React.FC<ThemedSectionProps> = ({
  children,
  themeId,
  style,
  className,
}) => {
  const effectiveTheme = themesById[themeId ? themeId : 'default'];

  return (
    <ThemeProvider defaultTheme={effectiveTheme}>
      <div className={className} style={style}>
        {children}
      </div>
    </ThemeProvider>
  );
};
