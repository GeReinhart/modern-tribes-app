// @/components/layout/AppFooter.tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {ThemedText} from "@/components/common/layout/ThemedText.tsx";



export const AppFooter: React.FC = () => {
    const { theme } = useTheme();

    const footerStyle: React.CSSProperties = {
        padding: '12px 24px',
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
        marginTop: 'auto', // Pushes footer to bottom
    };

    const linksStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '4px',
    };

    const linkStyle: React.CSSProperties = {
        color: theme.colors.text,
        textDecoration: 'none',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'color 0.2s ease',
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer style={footerStyle}>
            <ThemedText variant="secondary" size="small" as="div">
                © {currentYear} Modern Tribes. All rights reserved.
            </ThemedText>
            <div style={linksStyle}>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                >
                    Privacy
                </a>
                <span style={{ color: theme.colors.text, fontSize: '11px' }}>•</span>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                >
                    Terms
                </a>
                <span style={{ color: theme.colors.text, fontSize: '11px' }}>•</span>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                >
                    Help
                </a>
            </div>
        </footer>
    );
};