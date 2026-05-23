import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useSearch } from '@/hooks/useSearch';
import { SearchResult } from '@/types/search.types';

const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const targetPath = result.project_id && result.tribe_id
        ? `/app/tribes/${result.tribe_id}/projects/${result.project_id}`
        : result.tribe_id
            ? `/app/tribes/${result.tribe_id}`
            : null;

    const contextLabel = result.project_id
        ? result.project_name
        : result.tribe_name;

    const contextType = result.project_id ? 'project' : 'tribe';

    return (
        <ThemedCard variant="primary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {result.tribe_name && (
                        <span style={{
                            fontSize: 'calc(var(--font-sm) * 0.85)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: `${theme.colors.primary}20`,
                            color: theme.colors.primary,
                            fontWeight: 600,
                        }}>
                            {result.tribe_name}
                        </span>
                    )}
                    {result.project_name && (
                        <span style={{
                            fontSize: 'calc(var(--font-sm) * 0.85)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: `${theme.colors.secondary}20`,
                            color: theme.colors.secondary,
                            fontWeight: 600,
                        }}>
                            {result.project_name}
                        </span>
                    )}
                </div>

                {result.content_summary && (
                    <ThemedText variant="primary" size="medium">
                        {result.content_summary}
                    </ThemedText>
                )}

                <div
                    style={{
                        fontSize: 'var(--font-sm)',
                        color: theme.colors.secondary,
                        lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{ __html: result.headline }}
                />

                {targetPath && (
                    <button
                        onClick={() => navigate(targetPath)}
                        style={{
                            alignSelf: 'flex-start',
                            marginTop: 'var(--space-xs)',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.colors.primary}`,
                            backgroundColor: 'transparent',
                            color: theme.colors.primary,
                            cursor: 'pointer',
                            fontSize: 'var(--font-sm)',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        {contextType === 'project' ? contextLabel : result.tribe_name}
                        <ThemedSvgIcon name="arrow-right" color={theme.colors.primary} size={14} />
                    </button>
                )}
            </div>
        </ThemedCard>
    );
};

const SearchPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const { results, loading, error } = useSearch(query);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('search.title') },
    ], [t]);

    const showResults = query.trim().length >= 2;

    return (
        <AppLayout breadcrumbs={breadcrumbs} bookmarkTitle={t('search.title')}>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <ThemedText variant="secondary" size="small">
                    {t('search.subtitle')}
                </ThemedText>
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <input
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('search.placeholder')}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: 'var(--font-md)',
                            border: `2px solid ${theme.colors.border}`,
                            borderRadius: '12px',
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = theme.colors.primary; }}
                        onBlur={e => { e.currentTarget.style.borderColor = theme.colors.border; }}
                    />
                </div>

            {loading && <ThemedLoadingSpinner />}

            {error && (
                <ThemedCard variant="secondary">
                    <ThemedText variant="secondary" size="medium">
                        {t('common.error')} {error}
                    </ThemedText>
                </ThemedCard>
            )}

            {!loading && !error && showResults && results.length === 0 && (
                <ThemedCard variant="secondary">
                    <ThemedText variant="secondary" size="medium">
                        {t('search.empty')}
                    </ThemedText>
                </ThemedCard>
            )}

            {!loading && results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {results.map(result => (
                        <SearchResultCard key={result.document_id} result={result} />
                    ))}
                </div>
            )}

            <style>{`
                mark {
                    background-color: ${theme.colors.primary}30;
                    color: ${theme.colors.primary};
                    border-radius: 2px;
                    padding: 0 2px;
                }
            `}</style>
        </AppLayout>
    );
};

export const SearchPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <SearchPageContent />
    </ThemeProvider>
);
