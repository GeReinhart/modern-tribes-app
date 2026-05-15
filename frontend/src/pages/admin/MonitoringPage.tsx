import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { useRecentChanges } from '@/hooks/useRecentChanges.ts';
import { RecentChange } from '@/types/monitoring.types.ts';

const HOURS_OPTIONS = [1, 4, 24, 48, 168];

const MonitoringPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [hours, setHours] = useState(4);
    const [userEmail, setUserEmail] = useState('');
    const { data, loading, error } = useRecentChanges(hours, userEmail || undefined);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.monitoring') },
    ], [t]);

    const columns = useMemo(() => [
        {
            key: 'entity',
            header: t('monitoring.entity'),
            render: (r: RecentChange) => (
                <span style={{ fontWeight: 600, color: theme.colors.primary }}>{r.entity}</span>
            ),
        },
        {
            key: 'entity_summary',
            header: t('monitoring.summary'),
            render: (r: RecentChange) => <span>{r.entity_summary ?? '—'}</span>,
        },
        {
            key: 'created_at',
            header: t('monitoring.createdAt'),
            render: (r: RecentChange) => (
                <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                    {new Date(r.created_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: 'created_by',
            header: t('monitoring.createdBy'),
            render: (r: RecentChange) => (
                <span style={{ fontSize: 'var(--font-sm)' }}>{r.created_by ?? '—'}</span>
            ),
        },
        {
            key: 'updated_at',
            header: t('monitoring.updatedAt'),
            render: (r: RecentChange) => (
                <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                    {new Date(r.updated_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: 'updated_by',
            header: t('monitoring.updatedBy'),
            render: (r: RecentChange) => (
                <span style={{ fontSize: 'var(--font-sm)' }}>{r.updated_by ?? '—'}</span>
            ),
        },
    ], [t, theme.colors.primary, theme.colors.secondary]);

    const headerActions = <AdminNavigation currentPage="monitoring" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <ThemedLoadingSpinner size="sm" />
            </div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <ThemedCard>
                <ThemedText size="small">{t('admin.monitoringSubtitle')}</ThemedText>
            </ThemedCard>
            {error && (
                <ThemedCard variant="danger">
                    <ThemedText variant="danger">{error}</ThemedText>
                </ThemedCard>
            )}
            <ThemedCard>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <ThemedText size="small">{t('admin.monitoringHours')}</ThemedText>
                        <select
                            value={hours}
                            onChange={e => setHours(Number(e.target.value))}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: `1px solid ${theme.colors.border}`,
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                fontSize: 'var(--font-sm)',
                                cursor: 'pointer',
                            }}
                        >
                            {HOURS_OPTIONS.map(h => (
                                <option key={h} value={h}>{h} {t('admin.monitoringHoursUnit')}</option>
                            ))}
                        </select>
                    </div>
                    <ThemedInput
                        label={t('monitoring.filterByUser')}
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        placeholder={t('monitoring.filterByUserPlaceholder')}
                        variant="primary"
                    />
                </div>
            </ThemedCard>
            <ThemedCard>
                {data.length === 0 ? (
                    <ThemedText size="small" variant="secondary">{t('monitoring.noChanges')}</ThemedText>
                ) : (
                    <ThemedTable
                        data={data}
                        columns={columns}
                        getRowId={r => `${r.entity}-${r.created_at}-${r.updated_at}`}
                    />
                )}
            </ThemedCard>
        </AppLayout>
    );
};

export const MonitoringPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><MonitoringPageContent /></ThemeProvider>
);
