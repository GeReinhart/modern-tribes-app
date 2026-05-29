import { Theme } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect } from 'react';

interface ThemedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  theme?: Theme;
}

export const ModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 ${className}`}
  >
    {children}
  </div>
);

export const ThemedModal: React.FC<ThemedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  theme: themeOverride,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} my-8`}
          style={{ borderTop: `4px solid ${theme.colors.primary}` }}
        >
          {(title || showCloseButton) && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              {title && (
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.primary }}
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="transition-colors"
                  style={{ color: theme.colors.text }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export const ThemedModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const ThemedModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  theme?: Theme;
}> = ({ children, className = '', theme: themeOverride }) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  return (
    <div
      className={`px-6 py-4 flex justify-end gap-3 ${className}`}
      style={{
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: `${theme.colors.surface}50`,
      }}
    >
      {children}
    </div>
  );
};
