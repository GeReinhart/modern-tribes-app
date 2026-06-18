import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { publicationService } from '@/app/platform/functions/publications/publication.service.ts';
import { PublicationAdminItem } from '@/app/platform/functions/publications/publication.types.ts';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ExternalLink, Search } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
}

function AdminFilters({
  searchInput,
  tribeFilter,
  projectFilter,
  tribes,
  projects,
  onSearch,
  onTribe,
  onProject,
}: {
  searchInput: string;
  tribeFilter: string;
  projectFilter: string;
  tribes: FilterOption[];
  projects: FilterOption[];
  onSearch: (v: string) => void;
  onTribe: (v: string) => void;
  onProject: (v: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const base: React.CSSProperties = {
    padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    outline: 'none',
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.colors.secondary,
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('publications.searchPlaceholder')}
          style={{ ...base, paddingLeft: '32px', width: '100%' }}
        />
      </div>
      <select
        value={tribeFilter}
        onChange={(e) => {
          onTribe(e.target.value);
          onProject('');
        }}
        style={{ ...base, cursor: 'pointer' }}
      >
        <option value="">{t('publications.allTribes')}</option>
        {tribes.map((tr) => (
          <option key={tr.id} value={tr.id}>
            {tr.name}
          </option>
        ))}
      </select>
      <select
        value={projectFilter}
        onChange={(e) => onProject(e.target.value)}
        style={{ ...base, cursor: 'pointer' }}
        disabled={projects.length === 0}
      >
        <option value="">{t('publications.allProjects')}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function PublicationAdminRow({
  pub,
  onUnpublish,
}: {
  pub: PublicationAdminItem;
  onUnpublish: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  return (
    <div
      style={{
        padding: '16px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        marginBottom: '10px',
        backgroundColor: theme.colors.surface,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <ThemedText
            variant="primary"
            size="small"
            style={{ fontWeight: 700, marginBottom: '4px' }}
          >
            {pub.title}
          </ThemedText>
          <ThemedText variant="secondary" size="small">
            {pub.tribe_name && pub.project_name ? `${pub.tribe_name} › ${pub.project_name} · ` : ''}
            {new Date(pub.published_at).toISOString().slice(0, 10)}
            {pub.published_by_login && ` · ${pub.published_by_login}`}
          </ThemedText>
          {pub.labels.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '8px',
              }}
            >
              {pub.labels.map((l) => (
                <span
                  key={l.id}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: 'var(--font-xs)',
                    backgroundColor: `${theme.colors.accent}20`,
                    color: theme.colors.accent,
                    border: `1px solid ${theme.colors.accent}40`,
                  }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <ThemedButton
            variant="ghost"
            onClick={() => navigate(`/public/publications/${pub.url_param_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ExternalLink size={14} />
            {t('publications.view')}
          </ThemedButton>
          <ThemedButton
            variant="ghost"
            onClick={onUnpublish}
            leftIcon={
              <ThemedSvgIcon name="eye-off" color="currentColor" size={16} />
            }
          >
            {t('publications.unpublish')}
          </ThemedButton>
        </div>
      </div>
    </div>
  );
}

const PublicationsAdminPageContent: React.FC = () => {
  const { t } = useTranslation();
  const [publications, setPublications] = useState<PublicationAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tribeFilter, setTribeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [confirmUnpublish, setConfirmUnpublish] =
    useState<PublicationAdminItem | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPublications = useCallback(() => {
    setLoading(true);
    setError(null);
    publicationService
      .listAdmin(
        debouncedSearch || undefined,
        tribeFilter || undefined,
        projectFilter || undefined,
      )
      .then(setPublications)
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, tribeFilter, projectFilter, t]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const handleUnpublish = async () => {
    if (!confirmUnpublish) return;
    setUnpublishing(true);
    try {
      await publicationService.adminUnpublish(confirmUnpublish.id);
      setConfirmUnpublish(null);
      fetchPublications();
    } catch {
      setError(t('common.error'));
    } finally {
      setUnpublishing(false);
    }
  };

  const tribes = Array.from(
    new Map(
      publications
        .filter((p) => p.tribe_id && p.tribe_name)
        .map((p) => [p.tribe_id!, p.tribe_name!]),
    ).entries(),
  ).map(([id, name]) => ({ id, name }));
  const projects = Array.from(
    new Map(
      publications
        .filter((p) => p.project_id && p.project_name && (!tribeFilter || p.tribe_id === tribeFilter))
        .map((p) => [p.project_id!, p.project_name!]),
    ).entries(),
  ).map(([id, name]) => ({ id, name }));

  return (
    <AppLayout
      breadcrumbs={[
        { label: t('common.admin'), path: '/admin/monitoring' },
        { label: t('publications.title') },
      ]}
      headerActions={<AdminNavigation currentPage="publications" />}
    >
      <ThemedSection themeId="main_1">
        <AdminFilters
          searchInput={searchInput}
          tribeFilter={tribeFilter}
          projectFilter={projectFilter}
          tribes={tribes}
          projects={projects}
          onSearch={setSearchInput}
          onTribe={setTribeFilter}
          onProject={setProjectFilter}
        />
        {error && (
          <div style={{ color: 'red', padding: '8px', marginBottom: '12px' }}>
            {error}
          </div>
        )}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '32px',
            }}
          >
            <ThemedLoadingSpinner size="sm" />
          </div>
        )}
        {!loading && !error && publications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <ThemedText variant="secondary" size="small">
              {t('publications.noResults')}
            </ThemedText>
          </div>
        )}
        {!loading &&
          publications.map((pub) => (
            <PublicationAdminRow
              key={pub.id}
              pub={pub}
              onUnpublish={() => setConfirmUnpublish(pub)}
            />
          ))}
      </ThemedSection>
      <ThemedConfirmDialog
        isOpen={!!confirmUnpublish}
        onClose={() => setConfirmUnpublish(null)}
        onConfirm={handleUnpublish}
        title={t('publications.unpublishConfirmTitle')}
        message={t('publications.unpublishConfirmMessage', {
          title: confirmUnpublish?.title ?? '',
        })}
        confirmText={t('publications.unpublish')}
        variant="warning"
        isLoading={unpublishing}
      />
    </AppLayout>
  );
};

export const AdminPublicationsPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <PublicationsAdminPageContent />
  </ThemeProvider>
);
