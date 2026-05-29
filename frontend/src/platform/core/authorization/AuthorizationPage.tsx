import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/core/layout/themes/components/ThemedInput.tsx';
import { StatusBadge } from '@/platform/core/layout/themes/components/StatusBadge.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedConfirmDialog } from '@/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedTabs } from '@/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/platform/functions/people/UserProfileContext.tsx';
import { useCrudPage } from '@/hooks/useCrudPage.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { PermissionModal } from './components/permissions/PermissionModal.tsx';
import { RoleModal } from './components/roles/RoleModal.tsx';
import { RolePermissionsBadges } from './components/roles/RolePermissionsBadges.tsx';
import {
  Permission,
  PermissionCreate,
  PermissionUpdate,
} from './permission.types.ts';
import { RoleCreate, RoleUpdate, RoleWithPermissions } from './role.types.ts';
import { usePermissionMutations, permissionsHooks } from './permissions-hooks.ts';
import { useRoleMutations, useRolesWithPermissions } from './roles-hooks.ts';

// ─── Roles Tab ────────────────────────────────────────────────────────────────

const RolesTab: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const { roles, loading, error, refetch } = useRolesWithPermissions();
  const {
    createRole,
    updateRole,
    deleteRole,
    loading: mutationLoading,
  } = useRoleMutations();
  const crud = useCrudPage<RoleWithPermissions, RoleCreate, RoleUpdate>(
    refetch,
    createRole as (
      data: RoleCreate,
    ) => Promise<RoleWithPermissions | undefined>,
    updateRole as (
      id: string,
      data: RoleUpdate,
    ) => Promise<RoleWithPermissions | undefined>,
    deleteRole,
  );

  const filteredRoles = useMemo(() => {
    if (!crud.filter.trim()) return roles;
    const term = crud.filter.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term)),
    );
  }, [roles, crud.filter]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (r: RoleWithPermissions) => (
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            {r.description && (
              <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
                {r.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'permissions',
        header: t('admin.columnPermissions'),
        render: (r: RoleWithPermissions) => (
          <RolePermissionsBadges permissions={r.permissions} maxDisplay={3} />
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (r: RoleWithPermissions) =>
          new Date(r.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (r: RoleWithPermissions) => (
          <StatusBadge status={r.status ?? 'active'} />
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (r: RoleWithPermissions) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton variant="secondary" onClick={() => crud.openEdit(r)}>
              {t('common.edit')}
            </ThemedButton>
            <ThemedButton
              variant="danger"
              onClick={() => crud.openDeleteSingle(r)}
            >
              {t('common.delete')}
            </ThemedButton>
          </div>
        ),
      },
    ],
    [t, theme.colors.secondary, crud],
  );

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ThemedButton variant="secondary" onClick={crud.openCreate}>
          {t('admin.addRole')}
        </ThemedButton>
        {crud.selectedRows.size > 0 && (
          <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <ThemedInput
        label={t('common.filter')}
        value={crud.filter}
        onChange={(e) => crud.setFilter(e.target.value)}
        placeholder={t('admin.searchNameDesc')}
        variant="primary"
      />
      {loading ? (
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          {error && (
            <ThemedCard variant="danger">
              <ThemedText variant="danger">{error}</ThemedText>
            </ThemedCard>
          )}
          <ThemedTable
            data={filteredRoles}
            columns={columns}
            getRowId={(r) => r.id}
            onRowClick={(r) => crud.openView(r)}
            selectedRows={crud.selectedRows}
            onRowSelect={crud.handleRowSelect}
          />
        </>
      )}
      <RoleModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        role={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedRoles')
            : t('admin.deleteRole')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeleteNamed', {
                name: crud.deleteDialog.entity?.name,
              })
        }
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={mutationLoading}
      />
    </>
  );
};

// ─── Permissions Tab ──────────────────────────────────────────────────────────

const PermissionsTab: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const { permissions, loading, error, refetch } = permissionsHooks();
  const {
    createPermission,
    updatePermission,
    deletePermission,
    loading: mutationLoading,
  } = usePermissionMutations();
  const crud = useCrudPage<Permission, PermissionCreate, PermissionUpdate>(
    refetch,
    createPermission,
    updatePermission,
    deletePermission,
  );

  const filteredPermissions = useMemo(() => {
    if (!crud.filter.trim()) return permissions;
    const term = crud.filter.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)),
    );
  }, [permissions, crud.filter]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (p: Permission) => (
          <div>
            <div style={{ fontWeight: 500 }}>{p.name}</div>
            {p.description && (
              <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
                {p.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (p: Permission) => new Date(p.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (p: Permission) => (
          <StatusBadge status={p.status ?? 'active'} />
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (p: Permission) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>
              {t('common.edit')}
            </ThemedButton>
            <ThemedButton
              variant="danger"
              onClick={() => crud.openDeleteSingle(p)}
            >
              {t('common.delete')}
            </ThemedButton>
          </div>
        ),
      },
    ],
    [t, theme.colors.secondary, crud],
  );

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ThemedButton variant="secondary" onClick={crud.openCreate}>
          {t('admin.addPermission')}
        </ThemedButton>
        {crud.selectedRows.size > 0 && (
          <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <ThemedInput
        label={t('common.filter')}
        value={crud.filter}
        onChange={(e) => crud.setFilter(e.target.value)}
        placeholder={t('admin.searchNameDesc')}
        variant="primary"
      />
      {loading ? (
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          {error && (
            <ThemedCard variant="danger">
              <ThemedText variant="danger">{error}</ThemedText>
            </ThemedCard>
          )}
          <ThemedTable
            data={filteredPermissions}
            columns={columns}
            getRowId={(p) => p.id}
            onRowClick={(p) => crud.openView(p)}
            selectedRows={crud.selectedRows}
            onRowSelect={crud.handleRowSelect}
          />
        </>
      )}
      <PermissionModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        permission={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedPermissions')
            : t('admin.deletePermission')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeleteNamed', {
                name: crud.deleteDialog.entity?.name,
              })
        }
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={mutationLoading}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'roles' | 'permissions';

const AuthorizationPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<TabKey>('roles');

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.authorization') },
    ],
    [t],
  );

  const tabs = useMemo(
    () => [
      { key: 'roles', label: t('admin.authorization.rolesTab') },
      { key: 'permissions', label: t('admin.authorization.permissionsTab') },
    ],
    [t],
  );

  const headerActions = <AdminNavigation currentPage="authorization" />;

  if (!isLoading && !user?.permissions?.includes('admin')) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedText size="small">{t('admin.authorizationSubtitle')}</ThemedText>
      </ThemedCard>
      <ThemedCard>
        <ThemedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(k) => setActiveTab(k as TabKey)}
        />
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: activeTab === 'roles' ? 'block' : 'none' }}>
            <RolesTab />
          </div>
          <div
            style={{ display: activeTab === 'permissions' ? 'block' : 'none' }}
          >
            <PermissionsTab />
          </div>
        </div>
      </ThemedCard>
    </AppLayout>
  );
};

export const AuthorizationPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <AuthorizationPageContent />
  </ThemeProvider>
);
