import { Theme } from '@/platform/layout/themes/themes.ts';
import { useTheme } from '@/platform/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  theme?: Theme;
}

export const ThemedErrorMessage: React.FC<ThemedErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
  theme: themeOverride,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: `${theme.colors.danger}10`,
        border: `1px solid ${theme.colors.danger}`,
      }}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill={theme.colors.danger}
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p
            className="text-sm font-medium"
            style={{ color: theme.colors.danger }}
          >
            {message}
          </p>
        </div>
        {onRetry && (
          <div className="ml-auto pl-3">
            <button
              onClick={onRetry}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: theme.colors.danger }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
