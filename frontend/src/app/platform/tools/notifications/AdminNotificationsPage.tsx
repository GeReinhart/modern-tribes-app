import { AdminNavigation, adminMainThemeId } from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useCurrentUserProfile } from '@/app/platform/functions/people/UserProfileContext.tsx';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { NotificationHistorySection } from './NotificationHistorySection.tsx';
import { NotificationSearchSection } from './NotificationSearchSection.tsx';

function NotificationsAdminContent(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isLoading } = useCurrentUserProfile();
  const [toast, setToast] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

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

  const handleSent = useCallback(
    (name: string) => {
      showToast(t('admin.notifications.success', { name }));
      setHistoryKey((k) => k + 1);
    },
    [showToast, t],
  );

  const handleError = useCallback(() => {
    showToast(t('admin.notifications.error'));
  }, [showToast, t]);

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
        <ThemedText variant="secondary">{t('admin.notifications.subtitle')}</ThemedText>
      </ThemedCard>
      <div style={{ marginTop: '16px' }}>
        <NotificationSearchSection onNotificationSent={handleSent} onError={handleError} />
      </div>
      <NotificationHistorySection refreshKey={historyKey} />
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
