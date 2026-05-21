import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { GithubIcon } from '@/components/common/icons/GithubIcon';

const GITHUB_URL = 'https://github.com/GeReinhart/modern-tribes-app';

const STACK = [
    { layer: 'Backend', tech: 'Python 3.12 · FastAPI · asyncpg' },
    { layer: 'Database', tech: 'PostgreSQL 16 (JSONB, full-text search, Alembic)' },
    { layer: 'Frontend', tech: 'React 18 · TypeScript · Vite · Tailwind CSS · PWA' },
    { layer: 'Auth', tech: 'Magic-link (passwordless) · JWT + refresh tokens' },
    { layer: 'Email', tech: 'SMTP via MailHog (dev)' },
    { layer: 'Packaging', tech: 'Docker / Podman' },
];

const PLATFORM_FEATURES = [
    'Passwordless authentication via magic link + JWT',
    'Granular permission system with roles',
    'Entity lifecycle (active / archived) with full audit trail',
    'Internationalisation (i18n) — EN / FR',
    'Themeable UI with multiple colour themes',
    'Installable PWA (mobile home screen)',
    'Outbound email with scheduling',
    'Rich-text editor with image upload and storage',
    'Document revision history',
    'Full-text search on document content',
    'User / Person separation (one user can represent multiple people)',
    'Tribe management with per-tribe membership and roles',
    'Projects attached to tribes',
    'Project documents with labels and publication workflow',
];

const APP_FEATURES = [
    { name: 'Todo list', desc: 'Tasks with status tracking, notes, and archive' },
    { name: 'Kanban', desc: 'Columnar board (up to 4 columns), card notes, theme-coloured columns' },
];

const AboutPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('about.title') },
    ], [t]);

    const tableHeaderStyle: React.CSSProperties = {
        padding: '8px 16px',
        textAlign: 'left',
        fontSize: 'var(--font-sm)',
        fontWeight: 700,
        color: theme.colors.secondary,
        borderBottom: `2px solid ${theme.colors.border}`,
        backgroundColor: `${theme.colors.primary}08`,
    };

    const tableCellStyle: React.CSSProperties = {
        padding: '8px 16px',
        fontSize: 'var(--font-sm)',
        color: theme.colors.text,
        borderBottom: `1px solid ${theme.colors.border}`,
    };

    const tagStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: '10px',
        fontSize: 'calc(var(--font-sm) * 0.85)',
        fontWeight: 600,
        backgroundColor: `${theme.colors.primary}18`,
        color: theme.colors.primary,
        border: `1px solid ${theme.colors.primary}30`,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <ThemedSection themeId="main_1">

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <ThemedText size="large" as="h1" style={{ fontWeight: 800, marginBottom: '6px' }}>
                            Modern Tribes
                        </ThemedText>
                        <ThemedText variant="secondary" size="small">
                            {t('about.subtitle')}
                        </ThemedText>
                    </div>
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            textDecoration: 'none',
                            fontSize: 'var(--font-sm)',
                            fontWeight: 600,
                            transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.border; }}
                    >
                        <GithubIcon color={theme.colors.text} size={18} />
                        {t('about.sourceCode')}
                    </a>
                </div>

                {/* Stack */}
                <div style={{ marginBottom: '28px' }}>
                    <ThemedText size="medium" as="h2" style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}>
                        {t('about.stack')}
                    </ThemedText>
                    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...tableHeaderStyle, width: '30%' }}>Layer</th>
                                    <th style={tableHeaderStyle}>Technology</th>
                                </tr>
                            </thead>
                            <tbody>
                                {STACK.map((row, i) => (
                                    <tr key={row.layer} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : `${theme.colors.primary}04` }}>
                                        <td style={{ ...tableCellStyle, fontWeight: 600, color: theme.colors.secondary }}>{row.layer}</td>
                                        <td style={tableCellStyle}>{row.tech}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Platform features */}
                <div style={{ marginBottom: '28px' }}>
                    <ThemedText size="medium" as="h2" style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}>
                        {t('about.platform')}
                    </ThemedText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {PLATFORM_FEATURES.map(f => (
                            <span key={f} style={tagStyle}>{f}</span>
                        ))}
                    </div>
                </div>

                {/* Application modules */}
                <div>
                    <ThemedText size="medium" as="h2" style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}>
                        {t('about.application')}
                    </ThemedText>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {APP_FEATURES.map(f => (
                            <div key={f.name} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '10px 14px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', borderLeft: `3px solid ${theme.colors.accent}` }}>
                                <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: theme.colors.accent, minWidth: '90px' }}>{f.name}</span>
                                <ThemedText variant="secondary" size="small">{f.desc}</ThemedText>
                            </div>
                        ))}
                    </div>
                </div>

            </ThemedSection>
        </AppLayout>
    );
};

const AboutPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <AboutPageContent />
    </ThemeProvider>
);

export default AboutPage;
