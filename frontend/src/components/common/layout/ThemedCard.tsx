import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/contexts/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

export const ThemedCard: React.FC<{
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'success'
    | 'ghost'
    | 'text';
  bordered?: boolean;
  theme?: Theme;
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  variant = 'primary',
  bordered = true,
  theme: themeOverride,
  className = '',
  onClick,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const style: CSSProperties = {
    border: `1px solid ${theme.colors.border}`,
    borderLeft: bordered
      ? `3px solid ${theme.colors[variant]}`
      : `1px solid ${theme.colors.border}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--card-pad)',
    background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
    boxShadow: 'var(--shadow-sm)',
    margin: 'var(--space-md) 0',
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
};
