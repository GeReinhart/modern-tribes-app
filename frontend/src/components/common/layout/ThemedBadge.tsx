import React, {CSSProperties} from "react";
import {Theme} from "@/components/themes/themes.ts";
import {useTheme} from "@/contexts/ThemeContext.tsx";

export const ThemedBadge: React.FC<{
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost'| 'text';
    theme?: Theme;
}> = ({ children, variant = 'secondary', theme: themeOverride }) => {
    const { theme: contextTheme } = useTheme();
    const theme = themeOverride || contextTheme;

    const style: CSSProperties = {
        backgroundColor: theme.colors[variant],
        color: 'white',
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        margin: '0 4px',
    };

    return <span style={style}>{children}</span>;
};
