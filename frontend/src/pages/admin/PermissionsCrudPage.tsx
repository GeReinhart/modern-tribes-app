import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { usePermissions, usePermissionMutations } from '@/hooks/usePermissions';
import { Permission, PermissionCreate, PermissionUpdate } from '@/types/permission.types';
import { PermissionModal } from '@/components/entities/permissions/PermissionModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const PermissionsCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { permissions, loading, error, refetch } = usePermissions();
    const { createPermission, updatePermission, deletePermission, loading: mutationLoading } = usePermissionMutations();
    const crud = useCrudPage<Permission, PermissionCreate, PermissionUpdate>(refetch, createPermission, updatePermission, deletePermission);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.permissions') },
    ], [t]);

    const filteredPermissions = useMemo(() => {
        if (!crud.filter.trim()) return permissions;
        const term = crud.filter.toLowerCase();
        return permissions.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
    }, [permissions, crud.filter]);

    const columns = useMemo(() => [
        {
            key: 'name', header: t('common.name'),
            render: (p: Permission) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{p.description}</div>}
                </div>
            ),
        },
        { key: 'created_at', header: t('common.created'), render: (p: Permission) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: t('common.actions'),
            render: (p: Permission) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addPermission')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="permissions" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>

                <ThemedText size="small">{t('admin.permissionsSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchNameDesc')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredPermissions} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <PermissionModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                permission={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedPermissions') : t('admin.deletePermission')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteNamed', { name: crud.deleteDialog.entity?.name })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PermissionsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PermissionsCrudPageContent /></ThemeProvider>
);
