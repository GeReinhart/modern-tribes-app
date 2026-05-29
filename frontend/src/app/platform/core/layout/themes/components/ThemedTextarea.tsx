import { Theme } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  theme?: Theme;
}

export const ThemedTextarea: React.FC<ThemedTextareaProps> = ({
  label,
  error,
  variant = 'primary',
  theme: themeOverride,
  className = '',
  style,
  ...props
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const textareaStyle: React.CSSProperties = {
    borderColor: error ? theme.colors.danger : theme.colors[variant],
    color: theme.colors.text,
    ...style,
  };

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: theme.colors[variant] }}
        >
          {label}
        </label>
      )}
      <textarea
        className={`
                    w-full px-3 py-2 border rounded-md shadow-sm
                    focus:outline-none focus:ring-2
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${className}
                `}
        style={textareaStyle}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.danger }}>
          {error}
        </p>
      )}
    </div>
  );
};
