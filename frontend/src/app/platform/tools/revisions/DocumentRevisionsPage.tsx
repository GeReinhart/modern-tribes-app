import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { formatDateTime } from '@/app/platform/core/dateFormat.ts';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { monitoringService } from '@/app/platform/functions/monitoring/monitoring.service.ts';
import { DocumentRevision } from '@/app/platform/functions/monitoring/monitoring.types.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

function formatDateForUrl(isoDate: string): string {
  const d = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

function parseDateFromUrl(s: string): Date | null {
  if (!s || s.length !== 14) return null;
  return new Date(
    Date.UTC(
      parseInt(s.slice(0, 4)),
      parseInt(s.slice(4, 6)) - 1,
      parseInt(s.slice(6, 8)),
      parseInt(s.slice(8, 10)),
      parseInt(s.slice(10, 12)),
      parseInt(s.slice(12, 14)),
    ),
  );
}

const DocumentRevisionsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { documentId, date } = useParams<{
    documentId: string;
    date?: string;
  }>();

  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    monitoringService
      .getDocumentRevisions(documentId)
      .then(setRevisions)
      .catch(() => setError(t('monitoring.revisions.loadError')))
      .finally(() => setLoading(false));
  }, [documentId, t]);

  // Redirect to the latest revision when no date is given
  useEffect(() => {
    if (!loading && revisions.length > 0 && !date) {
      navigate(
        `/admin/monitoring/documents/${documentId}/updated_at/${formatDateForUrl(revisions[0].updated_at)}`,
        { replace: true },
      );
    }
  }, [loading, revisions, date, documentId, navigate]);

  const selectedRevision = useMemo<DocumentRevision | null>(() => {
    if (!date || revisions.length === 0) return null;
    const target = parseDateFromUrl(date);
    if (!target) return null;
    const targetMs = target.getTime();
    return (
      revisions.find((r) => new Date(r.updated_at).getTime() === targetMs) ??
      revisions.reduce((closest, r) => {
        const diff = Math.abs(new Date(r.updated_at).getTime() - targetMs);
        const bestDiff = Math.abs(
          new Date(closest.updated_at).getTime() - targetMs,
        );
        return diff < bestDiff ? r : closest;
      }, revisions[0])
    );
  }, [date, revisions]);

  const selectedIndex = useMemo(
    () => (selectedRevision ? revisions.indexOf(selectedRevision) : -1),
    [selectedRevision, revisions],
  );

  const navigateTo = (revision: DocumentRevision) => {
    navigate(
      `/admin/monitoring/documents/${documentId}/updated_at/${formatDateForUrl(revision.updated_at)}`,
    );
  };

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.monitoring'), path: '/admin/monitoring' },
      { label: t('monitoring.revisions.title') },
    ],
    [t],
  );

  const headerActions = <AdminNavigation currentPage="monitoring" />;

  if (loading)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedText size="small" variant="secondary">
          {t('monitoring.revisions.documentId')}: <code>{documentId}</code>
        </ThemedText>
      </ThemedCard>

      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}

      {!error && revisions.length === 0 && (
        <ThemedCard>
          <ThemedText size="small" variant="secondary">
            {t('monitoring.revisions.none')}
          </ThemedText>
        </ThemedCard>
      )}

      {revisions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'flex-start',
          }}
        >
          {/* Revision list */}
          <div style={{ minWidth: '240px', maxWidth: '280px', flexShrink: 0 }}>
            <ThemedCard>
              <ThemedText
                size="small"
                style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}
              >
                {t('monitoring.revisions.list')} ({revisions.length})
              </ThemedText>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                {revisions.map((r, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={r.updated_at}
                      onClick={() => navigateTo(r)}
                      style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                        color: isSelected ? '#fff' : theme.colors.text,
                        border: `1px solid ${isSelected ? theme.colors.primary : (theme.colors.border ?? '#ddd')}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-xs)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-sm)',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {formatDateTime(r.updated_at)}
                        </span>
                        {r.is_current && (
                          <span
                            style={{
                              fontSize: 'var(--font-xs, 10px)',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: isSelected
                                ? 'rgba(255,255,255,0.25)'
                                : theme.colors.success,
                              color: isSelected ? '#fff' : '#fff',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {t('monitoring.revisions.current')}
                          </span>
                        )}
                      </div>
                      {r.updated_by && (
                        <div
                          style={{
                            fontSize: 'var(--font-xs, 11px)',
                            opacity: 0.8,
                            marginTop: 2,
                          }}
                        >
                          {r.updated_by}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ThemedCard>
          </div>

          {/* Revision content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedRevision ? (
              <>
                <ThemedCard>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 'var(--space-sm)',
                    }}
                  >
                    <ThemedText size="small" variant="secondary">
                      {formatDateTime(selectedRevision.updated_at)}
                      {selectedRevision.updated_by &&
                        ` — ${selectedRevision.updated_by}`}
                    </ThemedText>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <ThemedButton
                        variant="secondary"
                        disabled={selectedIndex >= revisions.length - 1}
                        onClick={() => navigateTo(revisions[selectedIndex + 1])}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <ThemedSvgIcon
                            name="arrow-left"
                            color="currentColor"
                            size={14}
                          />
                          {t('monitoring.revisions.older')}
                        </span>
                      </ThemedButton>
                      <ThemedButton
                        variant="secondary"
                        disabled={selectedIndex <= 0}
                        onClick={() => navigateTo(revisions[selectedIndex - 1])}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {t('monitoring.revisions.newer')}
                          <ThemedSvgIcon
                            name="arrow-right"
                            color="currentColor"
                            size={14}
                          />
                        </span>
                      </ThemedButton>
                    </div>
                  </div>
                  <div
                    className="prose max-w-none"
                    style={{
                      padding: 'var(--space-md)',
                      background: theme.colors.surface,
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: selectedRevision.content_html,
                    }}
                  />
                </ThemedCard>
              </>
            ) : (
              <ThemedCard>
                <ThemedText size="small" variant="secondary">
                  {t('monitoring.revisions.selectOne')}
                </ThemedText>
              </ThemedCard>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export const DocumentRevisionsPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <DocumentRevisionsPageContent />
  </ThemeProvider>
);
