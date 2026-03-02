import React, {CSSProperties} from "react";
import {Theme} from "@/components/themes/themes.ts";
import {useTheme} from "@/contexts/ThemeContext.tsx";
import {useAuth} from "@/contexts/AuthContext.tsx";

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost' | 'text';
    fullWidth?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    theme?: Theme;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    requiredPermissions?: string[];
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
                                                              ...props
                                                          }) => {
    const { theme: contextTheme } = useTheme();
    const { user } = useAuth();
    const theme = themeOverride || contextTheme;

    // Hide button if user doesn't have at least one of the required permissions
    if (requiredPermissions && !requiredPermissions.some(perm => user?.permissions?.includes(perm))) {
        return null;
    }

    const isDisabled = disabled || isLoading;

    const style: CSSProperties = {
        backgroundColor: isDisabled ? '#cccccc' : theme.colors[variant],
        color: isDisabled ? '#666666' : 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        borderRadius: '8px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isDisabled ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
        width: fullWidth ? '100%' : 'auto',
        opacity: isDisabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...customStyle,
    };

    return (
        <button
            type={type}
            className={className}
            style={style}
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            onMouseEnter={(e) => {
                if (!isDisabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isDisabled) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
            }}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {!isLoading && leftIcon && leftIcon}
            {isLoading ? (loadingText || children) : children}
            {!isLoading && rightIcon && rightIcon}
        </button>
    );
};