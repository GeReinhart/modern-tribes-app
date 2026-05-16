import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { ThemedSelect } from '@/components/common/form/ThemedSelect.tsx';
import { useRecentChanges } from '@/hooks/useRecentChanges.ts';
import { useUsers } from '@/hooks/useUsers.ts';
import { RecentChange } from '@/types/monitoring.types.ts';

const HOURS_OPTIONS = [1, 4, 24, 48, 168];
const STATUS_OPTIONS = ['active', 'pending', 'archived'];

const MonitoringPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [hours, setHours] = useState(4);

    const [userEmail, setUserEmail] = useState('');
    const [status, setStatus] = useState('');
    const { users } = useUsers();
    const { data, loading, error } = useRecentChanges(hours, userEmail || undefined, status || undefined);

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
            key: 'entity_id',
            header: t('monitoring.id'),
            render: (r: RecentChange) => (
                <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontFamily: 'monospace' }}>
                    {r.entity_id}
                </span>
            ),
        },
        {
            key: 'entity_summary',
            header: t('monitoring.summary'),
            render: (r: RecentChange) => <span>{r.entity_summary ?? '—'}</span>,
        },
        {
            key: 'entity_status',
            header: t('monitoring.status'),
            render: (r: RecentChange) => {
                const colors: Record<string, string> = {
                    active: theme.colors.primary,
                    pending: theme.colors.secondary,
                    archived: theme.colors.danger ?? '#999',
                };
                return (
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: colors[r.entity_status] ?? theme.colors.text }}>
                        {r.entity_status}
                    </span>
                );
            },
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div style={{ minWidth: '160px' }}>
                        <ThemedSelect
                            label={t('admin.monitoringHours')}
                            value={String(hours)}
                            onChange={v => setHours(Number(v))}
                            options={HOURS_OPTIONS.map(h => ({ value: String(h), label: `${h} ${t('admin.monitoringHoursUnit')}` }))}
                            allowEmpty={false}
                        />
                    </div>
                    <div style={{ minWidth: '160px' }}>
                        <ThemedSelect
                            label={t('monitoring.filterByStatus')}
                            value={status}
                            onChange={setStatus}
                            options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                            placeholder={t('monitoring.allStatuses')}
                        />
                    </div>
                    <div style={{ minWidth: '220px', flex: 1 }}>
                        <ThemedSelect
                            label={t('monitoring.filterByUser')}
                            value={userEmail}
                            onChange={setUserEmail}
                            options={users.map(u => ({ value: u.email, label: u.email }))}
                            placeholder={t('monitoring.allUsers')}
                        />
                    </div>
                </div>
            </ThemedCard>
            <ThemedCard>
                {data.length === 0 ? (
                    <ThemedText size="small" variant="secondary">{t('monitoring.noChanges')}</ThemedText>
                ) : (
                    <ThemedTable
                        data={data}
                        columns={columns}
                        getRowId={r => `${r.entity}-${r.entity_id}`}
                    />
                )}
            </ThemedCard>
        </AppLayout>
    );
};

export const MonitoringPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><MonitoringPageContent /></ThemeProvider>
);
