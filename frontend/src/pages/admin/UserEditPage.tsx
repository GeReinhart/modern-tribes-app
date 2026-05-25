import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { UserForm } from '@/components/entities/users/UserForm';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/components/layout/AdminNavigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import {
  useRepresentsByUserId,
  useRepresentsMutations,
} from '@/hooks/useRepresents';
import {
  useUserMutations,
  useUserWithRolesAndPermissions,
} from '@/hooks/useUsers';
import { User, UserCreate, UserUpdate } from '@/types/user.types';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const UserEditPageContent: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { user, loading: userLoading } = useUserWithRolesAndPermissions(
    userId ?? null,
  );
  const { represents, loading: representsLoading } = useRepresentsByUserId(
    userId ?? null,
  );
  const { updateUser } = useUserMutations();
  const { createRepresents, deleteRepresents } = useRepresentsMutations();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.people'), path: '/admin/people' },
      { label: t('admin.editUser') },
    ],
    [t],
  );

  const headerActions = <AdminNavigation currentPage="people" />;

  const handleSubmit = async (
    _data: UserCreate | UserUpdate,
    representPersonIds: string[],
  ) => {
    if (!user) return;
    setSubmitError(null);
    try {
      const data = _data as UserUpdate;
      await updateUser(user.id, data);

      const existingIds = represents.map((r) => r.person_id);
      const toAdd = representPersonIds.filter(
        (id) => !existingIds.includes(id),
      );
      const toRemove = represents.filter(
        (r) => !representPersonIds.includes(r.person_id),
      );
      await Promise.all([
        ...toAdd.map((pid) =>
          createRepresents({
            user_id: user.id,
            person_id: pid,
            status: 'active',
          }),
        ),
        ...toRemove.map((r) => deleteRepresents(r.id)),
      ]);

      navigate('/admin/people');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  if (userLoading || representsLoading)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );

  if (!user)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{t('admin.userNotFound')}</ThemedText>
        </ThemedCard>
      </AppLayout>
    );

  const initialRepresentPersonIds = represents.map((r) => r.person_id);

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      {submitError && (
        <div style={{ marginBottom: '16px' }}>
          <ThemedCard variant="danger">
            <ThemedText variant="danger">{submitError}</ThemedText>
          </ThemedCard>
        </div>
      )}
      <ThemedCard>
        <UserForm
          user={user as User}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/people')}
          initialRepresentPersonIds={initialRepresentPersonIds}
        />
      </ThemedCard>
    </AppLayout>
  );
};

export const UserEditPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <UserEditPageContent />
  </ThemeProvider>
);
