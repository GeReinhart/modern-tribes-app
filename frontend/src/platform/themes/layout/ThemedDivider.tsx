import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import { CSSProperties } from 'react';

export const ThemedDivider: React.FC<{
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'success'
    | 'ghost'
    | 'text';
  theme?: Theme;
}> = ({ variant = 'primary', theme: themeOverride }) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const style: CSSProperties = {
    height: '2px',
    background: `linear-gradient(to right, transparent, ${theme.colors[variant]}, transparent)`,
    border: 'none',
    margin: '20px 0',
  };

  return <hr style={style} />;
};
