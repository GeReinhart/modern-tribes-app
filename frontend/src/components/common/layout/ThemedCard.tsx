import React, {CSSProperties} from "react";
import {Theme} from "@/components/themes/themes.ts";
import {useTheme} from "@/contexts/ThemeContext.tsx";

export const ThemedCard: React.FC<{
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost'| 'text';
    bordered?: boolean;
    theme?: Theme;
    className?: string;
    onClick?: () => void;
}> = ({ children, variant = 'primary', bordered = true, theme: themeOverride, className = '', onClick }) => {
    const { theme: contextTheme } = useTheme();
    const theme = themeOverride || contextTheme;

    const style: CSSProperties = {
        border: bordered ? `3px solid ${theme.colors[variant]}` : 'none',
        borderRadius: '12px',
        padding: '24px',
        background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        margin: '16px 0',
        cursor: onClick ? 'pointer' : 'default',
    };

    return <div className={className} style={style} onClick={onClick}>{children}</div>;
};