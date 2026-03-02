import React, { useMemo } from 'react';
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

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Permissions' }];

const PermissionsCrudPageContent: React.FC = () => {
    const { theme } = useTheme();
    const { permissions, loading, error, refetch } = usePermissions();
    const { createPermission, updatePermission, deletePermission, loading: mutationLoading } = usePermissionMutations();
    const crud = useCrudPage<Permission, PermissionCreate, PermissionUpdate>(refetch, createPermission, updatePermission, deletePermission);

    const filteredPermissions = useMemo(() => {
        if (!crud.filter.trim()) return permissions;
        const term = crud.filter.toLowerCase();
        return permissions.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
    }, [permissions, crud.filter]);

    const columns = [
        {
            key: 'name', header: 'Name',
            render: (p: Permission) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{p.description}</div>}
                </div>
            ),
        },
        { key: 'created_at', header: 'Created', render: (p: Permission) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: 'Actions',
            render: (p: Permission) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Permission</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
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
                <ThemedText variant="primary" size="large" as="h1">Permissions</ThemedText>
                <ThemedText size="small">Manage permissions</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by name or description..." variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredPermissions} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <PermissionModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                permission={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Permissions' : 'Delete Permission'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} permission(s)?`
                    : `Are you sure you want to delete "${crud.deleteDialog.entity?.name}"?`}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PermissionsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PermissionsCrudPageContent /></ThemeProvider>
);
