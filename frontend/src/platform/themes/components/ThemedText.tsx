import { Theme } from '@/platform/themes/themes.ts';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

export const ThemedText: React.FC<{
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'success'
    | 'ghost'
    | 'text';
  size?: 'small' | 'medium' | 'large';
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';
  theme?: Theme;
  style?: React.CSSProperties;
}> = ({
  children,
  variant = 'text',
  size = 'medium',
  as: Component = 'p',
  theme: themeOverride,
  style: customStyle,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const sizes: Record<string, string> = {
    small: 'var(--font-sm)',
    medium: 'var(--font-lg)',
    large: 'var(--font-xl)',
  };

  const style: CSSProperties = {
    color: theme.colors[variant],
    fontSize: sizes[size],
    fontWeight: '600',
    margin: 'var(--space-sm) 0',
    ...customStyle,
  };

  return <Component style={style}>{children}</Component>;
};
