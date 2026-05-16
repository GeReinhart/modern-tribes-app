import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useRepresents, useRepresentsMutations } from '@/hooks/useRepresents';
import { useUsers } from '@/hooks/useUsers';
import { usePersons } from '@/hooks/usePersons';
import { Represents, RepresentsCreate, RepresentsUpdate } from '@/types/represents.types';
import { RepresentsModal } from '@/components/entities/represents/RepresentsModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { StatusBadge } from '@/components/common/layout/StatusBadge.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const RepresentsCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { represents, loading, error, refetch } = useRepresents();
    const { createRepresents, updateRepresents, deleteRepresents, loading: mutationLoading } = useRepresentsMutations();
    const { users } = useUsers();
    const { persons } = usePersons();
    const crud = useCrudPage<Represents, RepresentsCreate, RepresentsUpdate>(refetch, createRepresents, updateRepresents, deleteRepresents);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.represents') },
    ], [t]);

    const getUserLabel = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user?.email ?? userId;
    };

    const getPersonLabel = (personId: string) => {
        const person = persons.find(p => p.id === personId);
        return person ? `${person.first_name} ${person.last_name}` : personId;
    };

    const filteredRepresents = useMemo(() => {
        if (!crud.filter.trim()) return represents;
        const term = crud.filter.toLowerCase();
        return represents.filter(r =>
            [getUserLabel(r.user_id), getPersonLabel(r.person_id)].join(' ').toLowerCase().includes(term)
        );
    }, [represents, crud.filter, users, persons]);

    const columns = useMemo(() => [
        {
            key: 'user',
            header: t('admin.columnUser'),
            render: (r: Represents) => (
                <span style={{ fontWeight: 500, color: theme.colors.primary }}>{getUserLabel(r.user_id)}</span>
            ),
        },
        {
            key: 'person',
            header: t('admin.columnPerson'),
            render: (r: Represents) => <span>{getPersonLabel(r.person_id)}</span>,
        },
        {
            key: 'created_at',
            header: t('common.created'),
            render: (r: Represents) => new Date(r.created_at).toLocaleDateString(),
        },
        {
            key: 'status',
            header: t('monitoring.status'),
            render: (r: Represents) => <StatusBadge status={r.status ?? 'active'} />,
        },
        {
            key: 'actions',
            header: t('common.actions'),
            render: (r: Represents) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(r)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(r)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.primary, crud, users, persons]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addRepresents')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="represents" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>
                <ThemedText size="small">{t('admin.representsSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput
                    label={t('common.filter')}
                    value={crud.filter}
                    onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchRepresents')}
                    variant="primary"
                />
                {crud.filter && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: theme.colors.secondary }}>
                        {t('admin.foundResults', { count: filteredRepresents.length })}
                    </div>
                )}
            </ThemedCard>
            <ThemedCard>
                <ThemedTable
                    data={filteredRepresents}
                    columns={columns}
                    getRowId={r => r.id}
                    onRowClick={r => crud.openView(r)}
                    selectedRows={crud.selectedRows}
                    onRowSelect={crud.handleRowSelect}
                />
            </ThemedCard>
            <RepresentsModal
                isOpen={crud.modalState.isOpen}
                onClose={crud.closeModal}
                represents={crud.modalState.entity}
                mode={crud.modalState.mode}
                onSubmit={crud.handleSubmit}
            />
            <ThemedConfirmDialog
                isOpen={crud.deleteDialog.isOpen}
                onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedRepresents') : t('admin.deleteRepresents')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteRepresents')}
                confirmText={t('common.delete')}
                variant="danger"
                isLoading={mutationLoading}
            />
        </AppLayout>
    );
};

export const RepresentsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><RepresentsCrudPageContent /></ThemeProvider>
);
