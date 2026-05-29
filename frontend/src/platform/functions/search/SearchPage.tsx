import { ThemedSvgIcon } from '@/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useSearch } from './useSearch.ts';
import { SearchResult } from './search.types.ts';

const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <ThemedCard variant="primary">
      <div
        onClick={() => navigate(result.routing_path)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
          }}
        >
          {result.tribe_name && (
            <span
              style={{
                fontSize: 'calc(var(--font-sm) * 0.85)',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary,
                fontWeight: 600,
              }}
            >
              {result.tribe_name}
            </span>
          )}
          {result.project_name && (
            <span
              style={{
                fontSize: 'calc(var(--font-sm) * 0.85)',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: `${theme.colors.secondary}20`,
                color: theme.colors.secondary,
                fontWeight: 600,
              }}
            >
              {result.project_name}
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ThemedSvgIcon
              name="arrow-right"
              color={theme.colors.primary}
              size={14}
            />
          </span>
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
      </div>
    </ThemedCard>
  );
};

const SearchPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const { results, loading, error } = useSearch(query);

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('search.title') },
    ],
    [t],
  );

  const showResults = query.trim().length >= 2;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
          }}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {results.map((result) => (
            <SearchResultCard key={result.entity_id} result={result} />
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
