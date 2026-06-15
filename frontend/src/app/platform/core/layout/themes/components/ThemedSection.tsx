import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { ReactNode } from 'react';

import { predefinedThemes, themesById } from '@/app/platform/core/layout/themes/themes.ts';

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
  if (!themeId) {
    return <div className={className} style={style}>{children}</div>;
  }

  const effectiveTheme = themesById[themeId] ?? predefinedThemes.default;

  return (
    <ThemeProvider key={themeId} defaultTheme={effectiveTheme}>
      <div className={className} style={style}>
        {children}
      </div>
    </ThemeProvider>
  );
};
