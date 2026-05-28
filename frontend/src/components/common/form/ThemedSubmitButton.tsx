import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost';
  isLoading?: boolean;
  loadingText?: string;
  theme?: Theme;

  fullWidth?: boolean;
}

export const ThemedSubmitButton: React.FC<ThemedSubmitButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  loadingText = 'Loading...',
  theme: themeOverride,
  fullWidth = true,
  disabled,
  className = '',
  style,
  type = 'button',
  ...props
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const buttonStyle: React.CSSProperties = {
    backgroundColor: theme.colors[variant],
    borderColor: theme.colors[variant],
    ...style,
  };

  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className={`
                group relative flex justify-center py-3 px-4 border border-transparent 
                text-sm font-medium rounded-lg text-white
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
      style={buttonStyle}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
};
