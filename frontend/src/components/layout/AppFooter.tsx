import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from "@/components/common/layout/ThemedText.tsx";

export const AppFooter: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const footerStyle: React.CSSProperties = {
        padding: '12px 24px',
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
        marginTop: 'auto',
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
                {t('footer.allRightsReserved', { year: currentYear })}
            </ThemedText>
            <div style={linksStyle}>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.text; }}
                >
                    {t('footer.privacy')}
                </a>
                <span style={{ color: theme.colors.text, fontSize: '11px' }}>•</span>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.text; }}
                >
                    {t('footer.terms')}
                </a>
                <span style={{ color: theme.colors.text, fontSize: '11px' }}>•</span>
                <a
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.text; }}
                >
                    {t('footer.help')}
                </a>
            </div>
        </footer>
    );
};
