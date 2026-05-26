import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/contexts/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

export const ThemedBadge: React.FC<{
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'success'
    | 'ghost'
    | 'text';
  theme?: Theme;
}> = ({ children, variant = 'secondary', theme: themeOverride }) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const style: CSSProperties = {
    backgroundColor: theme.colors[variant],
    color: 'white',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-xs)',
    fontWeight: 'bold',
    display: 'inline-block',
    margin: '0 var(--space-xs)',
  };

  return <span style={style}>{children}</span>;
};
