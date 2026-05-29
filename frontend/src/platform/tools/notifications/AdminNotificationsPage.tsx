import { ThemedInput } from '@/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { RowActionsMenu } from '@/components/common/menu/RowActionsMenu.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/contexts/UserProfileContext.tsx';
import { useUserSearch } from '@/hooks/useUserSearch.ts';
import { UserSearchResult } from '@/types/notification.types.ts';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { SendNotificationModal } from './SendNotificationModal.tsx';

function NotificationsAdminContent(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isLoading } = useCurrentUserProfile();
  const [query, setQuery] = useState('');
  const [modalUser, setModalUser] = useState<UserSearchResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { results: users, loading } = useUserSearch(query);

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.notifications.title') },
    ],
    [t],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'full_name',
        header: t('admin.notifications.name'),
        render: (u: UserSearchResult) => (
          <span style={{ fontWeight: 500, color: theme.colors.primary }}>
            {u.full_name}
          </span>
        ),
      },
      {
        key: 'email',
        header: t('admin.notifications.email'),
        render: (u: UserSearchResult) => <span>{u.email}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (u: UserSearchResult) => (
          <RowActionsMenu
            actions={[
              {
                icon: 'bell',
                label: t('admin.notifications.sendAction'),
                onClick: () => setModalUser(u),
              },
            ]}
          />
        ),
      },
    ],
    [t, theme.colors.primary],
  );

  if (!isLoading && !user?.permissions?.includes('admin')) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      headerActions={<AdminNavigation currentPage="notifications" />}
    >
      <ThemedCard>
        <ThemedText variant="primary" as="h2">
          {t('admin.notifications.title')}
        </ThemedText>
        <ThemedText variant="secondary">
          {t('admin.notifications.subtitle')}
        </ThemedText>
      </ThemedCard>
      <div style={{ marginTop: '16px' }}>
        <ThemedCard>
          <ThemedInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.notifications.searchPlaceholder')}
            style={{ marginBottom: '16px', width: '100%' }}
          />
          {loading && <ThemedLoadingSpinner />}
          {!loading && query.length > 0 && users.length === 0 && (
            <ThemedText variant="ghost">
              {t('admin.notifications.noResults')}
            </ThemedText>
          )}
          {!loading && users.length > 0 && (
            <ThemedTable
              data={users}
              columns={columns}
              getRowId={(u) => u.id}
            />
          )}
        </ThemedCard>
      </div>
      <SendNotificationModal
        user={modalUser}
        onClose={() => setModalUser(null)}
        onSuccess={(name) => {
          setModalUser(null);
          showToast(t('admin.notifications.success', { name }));
        }}
        onError={() => showToast(t('admin.notifications.error'))}
      />
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: theme.colors.primary,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </AppLayout>
  );
}

export function AdminNotificationsPage(): React.ReactElement {
  return (
    <ThemeProvider defaultTheme={adminMainThemeId}>
      <NotificationsAdminContent />
    </ThemeProvider>
  );
}
