import { Theme } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  theme?: Theme;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'primary',
  theme: themeOverride,
  className = '',
  id,
  style,
  ...props
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const inputStyle: React.CSSProperties = {
    borderColor: error ? theme.colors.danger : theme.colors[variant],
    color: theme.colors[variant],
    ...style,
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1"
          style={{ color: theme.colors[variant] }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
                        block w-full rounded-lg border px-3 py-2
                        focus:outline-none focus:ring-2
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${className}
                    `}
          style={inputStyle}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.danger }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors[variant] }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
