import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useTribes, useTribeMutations } from '@/hooks/useTribes';
import { Tribe, TribeCreate, TribeUpdate } from '@/types/tribe.types';
import { TribeModal } from '@/components/entities/tribes/TribeModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { StatusBadge } from '@/components/common/layout/StatusBadge.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const TribesCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { tribes, loading, error, refetch } = useTribes();
    const { createTribe, updateTribe, deleteTribe, loading: mutationLoading } = useTribeMutations();
    const crud = useCrudPage<Tribe, TribeCreate, TribeUpdate>(refetch, createTribe, updateTribe, deleteTribe);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.tribes') },
    ], [t]);

    const filteredTribes = useMemo(() => {
        if (!crud.filter.trim()) return tribes;
        const term = crud.filter.toLowerCase();
        return tribes.filter(tr => tr.name.toLowerCase().includes(term));
    }, [tribes, crud.filter]);

    const columns = useMemo(() => [
        { key: 'name', header: t('common.name'), render: (tr: Tribe) => <div style={{ fontWeight: 500 }}>{tr.name}</div> },
        {
            key: 'document', header: t('admin.columnDocument'),
            render: (tr: Tribe) => (
                <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
                    {tr.document_id ? <span style={{ color: theme.colors.primary }}>{t('admin.attached')}</span> : t('admin.none')}
                </span>
            ),
        },
        { key: 'created_at', header: t('common.created'), render: (tr: Tribe) => new Date(tr.created_at).toLocaleDateString() },
        {
            key: 'status', header: t('monitoring.status'),
            render: (tr: Tribe) => (
                <StatusBadge status={tr.status ?? 'active'} />
            ),
        },
        {
            key: 'actions', header: t('common.actions'),
            render: (tr: Tribe) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(tr)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(tr)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, theme.colors.primary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addTribe')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="tribes" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>

                <ThemedText size="small">{t('admin.tribesSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchName')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredTribes} columns={columns} getRowId={tr => tr.id}
                    onRowClick={tr => crud.openView(tr)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <TribeModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                tribe={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedTribes') : t('admin.deleteTribe')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteNamed', { name: crud.deleteDialog.entity?.name })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const TribesCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><TribesCrudPageContent /></ThemeProvider>
);
