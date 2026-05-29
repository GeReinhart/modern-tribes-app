import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedInput } from '@/platform/core/layout/themes/components/ThemedInput.tsx';
import { StatusBadge } from '@/platform/core/layout/themes/components/StatusBadge.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedConfirmDialog } from '@/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import {
  ThemedModal,
  ThemedModalBody,
  ThemedModalFooter,
} from '@/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedTable } from '@/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedTabs } from '@/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { PersonModal } from '@/platform/functions/people/persons/PersonModal.tsx';
import { UserModal } from '@/platform/functions/people/users/UserModal.tsx';
import { UserRolesBadges } from '@/platform/functions/people/users/UserRolesBadges.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/platform/functions/people/UserProfileContext.tsx';
import { useCrudPage } from '@/platform/functions/documents/useCrudPage.ts';
import { usePersonMutations, usePersons } from '@/platform/functions/people/persons/usePersons.ts';
import { useRepresents } from '@/platform/functions/people/represents/useRepresents.ts';
import {
  useUserMutations,
  useUsersWithRolesAndPermissions,
} from '@/platform/functions/people/users/useUsers.ts';
import { SendNotificationModal } from '@/platform/tools/notifications/SendNotificationModal.tsx';
import { userService } from '@/platform/functions/people/users/user.service.ts';
import { UserSearchResult } from '@/platform/tools/notifications/notification.types.ts';
import { Person, PersonCreate, PersonUpdate } from '@/platform/functions/people/persons/person.types.ts';
import {
  UserCreate,
  UserUpdate,
  UserWithRolesAndPermissions,
} from '@/platform/functions/people/users/user.types.ts';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

// ─── Users Tab ───────────────────────────────────────────────────────────────

const UsersTab: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const { users, loading, error, refetch } = useUsersWithRolesAndPermissions();
  const {
    createUser,
    updateUser,
    deleteUser,
    loading: mutationLoading,
  } = useUserMutations();
  const crud = useCrudPage<UserWithRolesAndPermissions, UserCreate, UserUpdate>(
    refetch,
    createUser as (
      data: UserCreate,
    ) => Promise<UserWithRolesAndPermissions | undefined>,
    updateUser as (
      id: string,
      data: UserUpdate,
    ) => Promise<UserWithRolesAndPermissions | undefined>,
    deleteUser,
  );
  const { persons } = usePersons();
  const { represents } = useRepresents();

  const [magicLinkModal, setMagicLinkModal] = useState<{
    isOpen: boolean;
    url: string;
    email: string;
  }>({
    isOpen: false,
    url: '',
    email: '',
  });
  const [magicLinkAction, setMagicLinkAction] = useState<{
    userId: string;
    type: 'send' | 'generate';
  } | null>(null);
  const [sendFeedback, setSendFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationModalUser, setNotificationModalUser] =
    useState<UserSearchResult | null>(null);

  const handleSendMagicLink = useCallback(
    async (user: UserWithRolesAndPermissions) => {
      setMagicLinkAction({ userId: user.id, type: 'send' });
      setSendFeedback(null);
      try {
        await userService.sendMagicLink(user.id);
        setSendFeedback({
          success: true,
          message: t('admin.people.magicLinkSent', { email: user.email }),
        });
        setTimeout(() => setSendFeedback(null), 4000);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : t('admin.people.magicLinkError');
        setSendFeedback({ success: false, message: msg });
        setTimeout(() => setSendFeedback(null), 6000);
      } finally {
        setMagicLinkAction(null);
      }
    },
    [t],
  );

  const handleGenerateMagicLink = useCallback(
    async (user: UserWithRolesAndPermissions) => {
      setMagicLinkAction({ userId: user.id, type: 'generate' });
      try {
        const result = await userService.generateMagicLink(user.id);
        setMagicLinkModal({
          isOpen: true,
          url: result.magic_link,
          email: result.email,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : t('admin.people.magicLinkError');
        setSendFeedback({ success: false, message: msg });
        setTimeout(() => setSendFeedback(null), 6000);
      } finally {
        setMagicLinkAction(null);
      }
    },
    [t],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(magicLinkModal.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [magicLinkModal.url]);

  const closeMagicLinkModal = useCallback(() => {
    setMagicLinkModal((prev) => ({ ...prev, isOpen: false }));
    setCopied(false);
  }, []);

  const getPersonName = useCallback(
    (personId: string): string | null => {
      const person = persons.find((p) => p.id === personId);
      return person ? `${person.first_name} ${person.last_name}` : null;
    },
    [persons],
  );

  const getRepresentedPersonIds = useCallback(
    (userId: string): string[] =>
      represents.filter((r) => r.user_id === userId).map((r) => r.person_id),
    [represents],
  );

  const filteredUsers = useMemo(() => {
    if (!crud.filter.trim()) return users;
    const term = crud.filter.toLowerCase();
    return users.filter(
      (u) =>
        u.login.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term),
    );
  }, [users, crud.filter]);

  const columns = useMemo(
    () => [
      {
        key: 'login',
        header: t('admin.columnUser'),
        render: (u: UserWithRolesAndPermissions) => (
          <div>
            <div style={{ fontWeight: 500 }}>{u.login}</div>
            <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
              {u.email}
            </div>
          </div>
        ),
      },
      {
        key: 'roles',
        header: t('admin.columnRoles'),
        render: (u: UserWithRolesAndPermissions) => (
          <UserRolesBadges roles={u.roles} maxDisplay={3} />
        ),
      },
      {
        key: 'persons',
        header: t('admin.columnPerson'),
        render: (u: UserWithRolesAndPermissions) => {
          const directName = u.person_id ? getPersonName(u.person_id) : null;
          const representedIds = getRepresentedPersonIds(u.id);
          if (!directName && representedIds.length === 0)
            return (
              <span style={{ color: theme.colors.secondary, fontSize: '12px' }}>
                —
              </span>
            );
          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {directName && (
                <span
                  style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: `${theme.colors.primary}20`,
                    color: theme.colors.primary,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {directName}
                </span>
              )}
              {representedIds.map((pid) => {
                const name = getPersonName(pid);
                if (!name) return null;
                return (
                  <span
                    key={pid}
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: `${theme.colors.accent}20`,
                      color: theme.colors.accent,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (u: UserWithRolesAndPermissions) =>
          new Date(u.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (u: UserWithRolesAndPermissions) => (
          <StatusBadge status={u.status ?? 'active'} />
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (u: UserWithRolesAndPermissions) => {
          const isActing = magicLinkAction?.userId === u.id;
          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ThemedButton
                variant="secondary"
                onClick={() => navigate(`/admin/users/${u.url_param_id}/edit`)}
                title={t('common.edit')}
                style={{ padding: 'var(--btn-pad-v)' }}
              >
                <ThemedSvgIcon name="pencil" color="currentColor" size={16} />
              </ThemedButton>
              <ThemedButton
                variant="danger"
                onClick={() => crud.openDeleteSingle(u)}
                title={t('common.delete')}
                style={{ padding: 'var(--btn-pad-v)' }}
              >
                <ThemedSvgIcon name="trash" color="currentColor" size={16} />
              </ThemedButton>
              <ThemedButton
                variant="accent"
                isLoading={isActing && magicLinkAction?.type === 'send'}
                disabled={!!magicLinkAction}
                onClick={() => handleSendMagicLink(u)}
              >
                {t('admin.people.sendMagicLink')}
              </ThemedButton>
              <ThemedButton
                variant="ghost"
                isLoading={isActing && magicLinkAction?.type === 'generate'}
                disabled={!!magicLinkAction}
                onClick={() => handleGenerateMagicLink(u)}
              >
                {t('admin.people.generateMagicLink')}
              </ThemedButton>
              <ThemedButton
                variant="secondary"
                onClick={() =>
                  setNotificationModalUser({
                    id: u.id,
                    url_param_id: u.url_param_id,
                    login: u.login,
                    email: u.email,
                    full_name:
                      (u.person_id ? getPersonName(u.person_id) : null) ??
                      u.login,
                  })
                }
              >
                {t('admin.people.sendNotification')}
              </ThemedButton>
            </div>
          );
        },
      },
    ],
    [
      t,
      navigate,
      theme.colors.secondary,
      theme.colors.primary,
      theme.colors.accent,
      crud,
      magicLinkAction,
      handleSendMagicLink,
      handleGenerateMagicLink,
      getPersonName,
      getRepresentedPersonIds,
    ],
  );

  return (
    <>
      {sendFeedback && (
        <ThemedCard variant={sendFeedback.success ? 'success' : 'danger'}>
          <ThemedText
            variant={sendFeedback.success ? 'success' : 'danger'}
            size="small"
          >
            {sendFeedback.message}
          </ThemedText>
        </ThemedCard>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ThemedButton
          variant="secondary"
          onClick={crud.openCreate}
          leftIcon={
            <ThemedSvgIcon name="plus" color="currentColor" size={16} />
          }
        >
          {t('admin.addUser')}
        </ThemedButton>
        {crud.selectedRows.size > 0 && (
          <ThemedButton
            variant="danger"
            onClick={crud.handleDeleteSelected}
            leftIcon={
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            }
          >
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <ThemedInput
        label={t('common.filter')}
        value={crud.filter}
        onChange={(e) => crud.setFilter(e.target.value)}
        placeholder={t('admin.searchLoginEmail')}
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
            data={filteredUsers}
            columns={columns}
            getRowId={(u) => u.id}
            onRowClick={(u) => crud.openView(u)}
            selectedRows={crud.selectedRows}
            onRowSelect={crud.handleRowSelect}
          />
        </>
      )}
      <UserModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        user={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedUsers')
            : t('admin.deleteUser')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeleteUser', {
                login: crud.deleteDialog.entity?.login,
              })
        }
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={mutationLoading}
      />
      <SendNotificationModal
        user={notificationModalUser}
        onClose={() => setNotificationModalUser(null)}
        onSuccess={(name) => {
          setNotificationModalUser(null);
          setSendFeedback({
            success: true,
            message: t('admin.notifications.success', { name }),
          });
          setTimeout(() => setSendFeedback(null), 4000);
        }}
        onError={() => {
          setSendFeedback({
            success: false,
            message: t('admin.notifications.error'),
          });
          setTimeout(() => setSendFeedback(null), 6000);
        }}
      />
      <ThemedModal
        isOpen={magicLinkModal.isOpen}
        onClose={closeMagicLinkModal}
        title={t('admin.people.magicLinkFor', { email: magicLinkModal.email })}
        size="lg"
      >
        <ThemedModalBody>
          <ThemedText size="small" variant="secondary">
            {t('admin.people.magicLinkWarning')}
          </ThemedText>
          <div
            style={{
              background: `${theme.colors.primary}08`,
              border: `1px solid ${theme.colors.primary}30`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '12px',
              wordBreak: 'break-all',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: 1.6,
            }}
          >
            {magicLinkModal.url}
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton
            variant="secondary"
            onClick={closeMagicLinkModal}
            leftIcon={
              <ThemedSvgIcon name="x" color="currentColor" size={16} />
            }
          >
            {t('common.close')}
          </ThemedButton>
          <ThemedButton variant="primary" onClick={handleCopy}>
            {copied ? t('admin.people.copied') : t('admin.people.copyLink')}
          </ThemedButton>
        </ThemedModalFooter>
      </ThemedModal>
    </>
  );
};

// ─── Persons Tab ─────────────────────────────────────────────────────────────

const PersonsTab: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const { persons, loading, error, refetch } = usePersons();
  const {
    createPerson,
    updatePerson,
    deletePerson,
    loading: mutationLoading,
  } = usePersonMutations();
  const crud = useCrudPage<Person, PersonCreate, PersonUpdate>(
    refetch,
    createPerson,
    updatePerson,
    deletePerson,
  );

  const getGenderLabel = useCallback(
    (gender: string) => {
      const labels: Record<string, string> = {
        male: t('admin.genderMale'),
        female: t('admin.genderFemale'),
        other: t('admin.genderOther'),
        prefer_not_to_say: t('admin.genderPreferNot'),
      };
      return labels[gender] || gender;
    },
    [t],
  );

  const filteredPersons = useMemo(() => {
    if (!crud.filter.trim()) return persons;
    const term = crud.filter.toLowerCase();
    return persons.filter((p) =>
      [
        p.first_name,
        p.last_name,
        `${p.first_name} ${p.last_name}`,
        p.gender,
        getGenderLabel(p.gender),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [persons, crud.filter, getGenderLabel]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (p: Person) => (
          <div>
            <div style={{ fontWeight: 500 }}>
              {p.first_name} {p.last_name}
            </div>
            <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
              {getGenderLabel(p.gender)}
            </div>
          </div>
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (p: Person) => new Date(p.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (p: Person) => <StatusBadge status={p.status ?? 'active'} />,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (p: Person) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton
              variant="secondary"
              onClick={() => crud.openEdit(p)}
              title={t('common.edit')}
              style={{ padding: 'var(--btn-pad-v)' }}
            >
              <ThemedSvgIcon name="pencil" color="currentColor" size={16} />
            </ThemedButton>
            <ThemedButton
              variant="danger"
              onClick={() => crud.openDeleteSingle(p)}
              title={t('common.delete')}
              style={{ padding: 'var(--btn-pad-v)' }}
            >
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            </ThemedButton>
          </div>
        ),
      },
    ],
    [t, theme.colors.secondary, crud, getGenderLabel],
  );

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ThemedButton
          variant="secondary"
          onClick={crud.openCreate}
          leftIcon={
            <ThemedSvgIcon name="plus" color="currentColor" size={16} />
          }
        >
          {t('admin.addPerson')}
        </ThemedButton>
        {crud.selectedRows.size > 0 && (
          <ThemedButton
            variant="danger"
            onClick={crud.handleDeleteSelected}
            leftIcon={
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            }
          >
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <ThemedInput
        label={t('common.filter')}
        value={crud.filter}
        onChange={(e) => crud.setFilter(e.target.value)}
        placeholder={t('admin.searchNameGenderDate')}
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
            data={filteredPersons}
            columns={columns}
            getRowId={(p) => p.id}
            onRowClick={(p) => crud.openView(p)}
            selectedRows={crud.selectedRows}
            onRowSelect={crud.handleRowSelect}
          />
        </>
      )}
      <PersonModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        person={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedPersons')
            : t('admin.deletePerson')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeletePerson', {
                name: `${crud.deleteDialog.entity?.first_name} ${crud.deleteDialog.entity?.last_name}`,
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

type TabKey = 'users' | 'persons';

const PeopleManagementPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.people') },
    ],
    [t],
  );

  const tabs = useMemo(
    () => [
      { key: 'users', label: t('admin.people.usersTab') },
      { key: 'persons', label: t('admin.people.personsTab') },
    ],
    [t],
  );

  const headerActions = <AdminNavigation currentPage="people" />;

  if (!isLoading && !user?.permissions?.includes('admin')) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedText size="small">{t('admin.peopleSubtitle')}</ThemedText>
      </ThemedCard>
      <ThemedCard>
        <ThemedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(k) => setActiveTab(k as TabKey)}
        />
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
            <UsersTab />
          </div>
          <div style={{ display: activeTab === 'persons' ? 'block' : 'none' }}>
            <PersonsTab />
          </div>
        </div>
      </ThemedCard>
    </AppLayout>
  );
};

export const AdminPeoplePage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <PeopleManagementPageContent />
  </ThemeProvider>
);
