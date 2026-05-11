import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useUsersWithRolesAndPermissions, useUserMutations } from '@/hooks/useUsers';
import { UserWithRolesAndPermissions, UserCreate, UserUpdate } from '@/types/user.types';
import { UserModal } from '@/components/entities/users/UserModal';
import { UserRolesBadges } from '@/components/entities/users/UserRolesBadges';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const UsersCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { users, loading, error, refetch } = useUsersWithRolesAndPermissions();
    const { createUser, updateUser, deleteUser, loading: mutationLoading } = useUserMutations();
    const crud = useCrudPage<UserWithRolesAndPermissions, UserCreate, UserUpdate>(
        refetch,
        createUser as (data: UserCreate) => Promise<UserWithRolesAndPermissions | undefined>,
        updateUser as (id: string, data: UserUpdate) => Promise<UserWithRolesAndPermissions | undefined>,
        deleteUser
    );

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.users') },
    ], [t]);

    const filteredUsers = useMemo(() => {
        if (!crud.filter.trim()) return users;
        const term = crud.filter.toLowerCase();
        return users.filter(u => u.login.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }, [users, crud.filter]);

    const columns = useMemo(() => [
        {
            key: 'login', header: t('admin.columnUser'),
            render: (u: UserWithRolesAndPermissions) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{u.login}</div>
                    <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{u.email}</div>
                </div>
            ),
        },
        { key: 'roles', header: t('admin.columnRoles'), render: (u: UserWithRolesAndPermissions) => <UserRolesBadges roles={u.roles} maxDisplay={3} /> },
        { key: 'created_at', header: t('common.created'), render: (u: UserWithRolesAndPermissions) => new Date(u.created_at).toLocaleDateString() },
        {
            key: 'actions', header: t('common.actions'),
            render: (u: UserWithRolesAndPermissions) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(u)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(u)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addUser')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="users" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>
                <ThemedText variant="primary" size="large" as="h1">{t('admin.users')}</ThemedText>
                <ThemedText size="small">{t('admin.usersSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchLoginEmail')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredUsers} columns={columns} getRowId={u => u.id}
                    onRowClick={u => crud.openView(u)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <UserModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                user={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedUsers') : t('admin.deleteUser')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteUser', { login: crud.deleteDialog.entity?.login })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const UsersCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><UsersCrudPageContent /></ThemeProvider>
);
