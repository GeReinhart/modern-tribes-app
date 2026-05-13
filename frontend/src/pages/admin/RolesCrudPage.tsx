import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useRolesWithPermissions, useRoleMutations } from '@/hooks/useRoles';
import { RoleWithPermissions, RoleCreate, RoleUpdate } from '@/types/role.types';
import { RoleModal } from '@/components/entities/roles/RoleModal';
import { RolePermissionsBadges } from '@/components/entities/roles/RolePermissionsBadges';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const RolesCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { roles, loading, error, refetch } = useRolesWithPermissions();
    const { createRole, updateRole, deleteRole, loading: mutationLoading } = useRoleMutations();
    const crud = useCrudPage<RoleWithPermissions, RoleCreate, RoleUpdate>(
        refetch,
        createRole as (data: RoleCreate) => Promise<RoleWithPermissions | undefined>,
        updateRole as (id: string, data: RoleUpdate) => Promise<RoleWithPermissions | undefined>,
        deleteRole
    );

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.roles') },
    ], [t]);

    const filteredRoles = useMemo(() => {
        if (!crud.filter.trim()) return roles;
        const term = crud.filter.toLowerCase();
        return roles.filter(r => r.name.toLowerCase().includes(term) || (r.description && r.description.toLowerCase().includes(term)));
    }, [roles, crud.filter]);

    const columns = useMemo(() => [
        {
            key: 'name', header: t('common.name'),
            render: (r: RoleWithPermissions) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    {r.description && <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{r.description}</div>}
                </div>
            ),
        },
        { key: 'permissions', header: t('admin.columnPermissions'), render: (r: RoleWithPermissions) => <RolePermissionsBadges permissions={r.permissions} maxDisplay={3} /> },
        { key: 'created_at', header: t('common.created'), render: (r: RoleWithPermissions) => new Date(r.created_at).toLocaleDateString() },
        {
            key: 'actions', header: t('common.actions'),
            render: (r: RoleWithPermissions) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(r)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(r)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addRole')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="roles" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>

                <ThemedText size="small">{t('admin.rolesSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchNameDesc')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredRoles} columns={columns} getRowId={r => r.id}
                    onRowClick={r => crud.openView(r)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <RoleModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                role={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedRoles') : t('admin.deleteRole')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteNamed', { name: crud.deleteDialog.entity?.name })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const RolesCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><RolesCrudPageContent /></ThemeProvider>
);
