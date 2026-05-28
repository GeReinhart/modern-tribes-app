import {
  IconName,
  ThemedSvgIcon,
} from '@/components/common/icons/ThemedSvgIcon.tsx';
import { Theme } from '@/components/themes/themes.ts';
import { useAuth } from '@/platform/authentication/AuthContext.tsx';
import { useResponsiveContext } from '@/contexts/ResponsiveContext.tsx';
import { useTheme } from '@/contexts/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'success'
    | 'ghost'
    | 'text';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  theme?: Theme;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  requiredPermissions?: string[];
  mobileIcon?: IconName;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  loadingText,
  theme: themeOverride,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  style: customStyle,
  requiredPermissions,
  mobileIcon,
  ...props
}) => {
  const { theme: contextTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsiveContext();
  const theme = themeOverride || contextTheme;

  // Hide button if user doesn't have at least one of the required permissions
  if (
    requiredPermissions &&
    !requiredPermissions.some((perm) => user?.permissions?.includes(perm))
  ) {
    return null;
  }

  const isDisabled = disabled || isLoading;
  const showIconOnly = isMobile && !!mobileIcon && !isLoading;

  const style: CSSProperties = {
    backgroundColor: isDisabled ? '#cccccc' : theme.colors[variant],
    color: isDisabled ? '#666666' : 'white',
    border: 'none',
    padding: showIconOnly
      ? 'var(--btn-pad-v)'
      : 'var(--btn-pad-v) var(--btn-pad-h)',
    fontSize: 'var(--btn-font)',
    fontWeight: 'bold',
    borderRadius: 'var(--radius-md)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isDisabled ? 'none' : 'var(--shadow-sm)',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    ...customStyle,
  };

  const labelForTitle = typeof children === 'string' ? children : undefined;

  return (
    <button
      type={type}
      className={className}
      style={style}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={showIconOnly ? labelForTitle : undefined}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {showIconOnly ? (
        <ThemedSvgIcon
          name={mobileIcon!}
          color={isDisabled ? '#666666' : 'white'}
          size={18}
        />
      ) : (
        <>
          {!isLoading && leftIcon && leftIcon}
          {isLoading ? loadingText || children : children}
          {!isLoading && rightIcon && rightIcon}
        </>
      )}
    </button>
  );
};
