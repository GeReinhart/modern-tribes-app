import { ThemedCard } from '@/components/common/layout/ThemedCard.tsx';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import DashboardBookmarksTab from '@/features/bookmarks/DashboardBookmarksTab';
import DashboardTasksTab from '@/features/dashboard/tabs/DashboardTasksTab';
import DashboardTribesTab from '@/features/dashboard/tabs/DashboardTribesTab';
import { TabConfigButton } from '@/features/tab-config/TabConfigButton';
import { TabConfigPopup } from '@/features/tab-config/TabConfigPopup';
import { useTabConfig } from '@/features/tab-config/useTabConfig';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useUrlTab } from '@/hooks/useUrlTab';
import { useVerifyAuthorization } from '@/hooks/userVerifyAuthorization.ts';
import { errorStyle } from '@/styles/theme.styles.tsx';
import { MenuAction } from '@/types/menu.types';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const TABS = (t: (k: string) => string) => [
  {
    key: 'tasks',
    label: t('dashboard.tabs.tasks'),
    Component: DashboardTasksTab,
  },
  {
    key: 'tribes',
    label: t('dashboard.tabs.tribes'),
    Component: DashboardTribesTab,
  },
  {
    key: 'bookmarks',
    label: t('dashboard.tabs.bookmarks'),
    Component: DashboardBookmarksTab,
  },
];

const DashboardPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: authorization,
    error: authorizationError,
    verifyAuthorization,
  } = useVerifyAuthorization();
  const { user } = useCurrentUserProfile();
  const [showTabConfig, setShowTabConfig] = useState(false);

  const allTabs = useMemo(
    () => TABS(t).map(({ key, label }) => ({ key, label })),
    [t],
  );
  const { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig } =
    useTabConfig('dashboard', allTabs);
  const { activeTab, breadcrumbTabs, handleTabChange } = useUrlTab(
    visibleTabs,
    '/app/dashboard',
    defaultTabKey,
  );
  const ActiveComponent =
    TABS(t).find((tb) => tb.key === activeTab)?.Component ?? DashboardTasksTab;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('dashboard.title') },
    ],
    [t],
  );

  // Check authorization
  useEffect(() => {
    verifyAuthorization(['admin', 'can_create_own_tribes']).catch((err) => {
      console.error('Authorization check failed:', err);
    });
  }, [verifyAuthorization]);

  const isAdmin = user?.permissions?.includes('admin') ?? false;
  const menuActions = useMemo(
    (): MenuAction[] => [
      ...(authorization?.authorized
        ? [
            {
              icon: 'plus' as const,
              label: t('tribes.createTribe'),
              onClick: () => navigate('/app/tribes/create'),
            },
          ]
        : []),
      ...(isAdmin
        ? [
            {
              icon: 'settings' as const,
              label: t('common.admin'),
              onClick: () => navigate('/admin'),
            },
          ]
        : []),
    ],
    [authorization?.authorized, isAdmin, t, navigate],
  );

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      breadcrumbTabs={breadcrumbTabs}
      menuActions={menuActions}
      bookmarkTitle={t('dashboard.title')}
    >
      {showTabConfig && (
        <TabConfigPopup
          tabsWithConfig={tabsWithConfig}
          onSave={saveConfig}
          onClose={() => setShowTabConfig(false)}
        />
      )}

      {/* Authorization Error Message */}
      {authorizationError && (
        <ThemedCard>
          <div style={errorStyle}>
            <strong>Authorization Error:</strong> {authorizationError.message}
          </div>
        </ThemedCard>
      )}

      <ThemedTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        configButton={
          <TabConfigButton onClick={() => setShowTabConfig(true)} />
        }
      />
      <ActiveComponent />
    </AppLayout>
  );
};

const DashboardPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <DashboardPageContent />
  </ThemeProvider>
);

export default DashboardPage;
