import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import DashboardBookmarksTab from '@/app/features/bookmarks/DashboardBookmarksTab.tsx';
import MyTasksTab from '@/app/features/tasks/my_tasks/MyTasksTab.tsx';
import DashboardTribesTab from '@/app/features/glue/dashboard/tabs/DashboardTribesTab.tsx';
import { TabConfigPopup } from '@/app/features/glue/tab-config/TabConfigPopup.tsx';
import { useTabConfig } from '@/app/features/glue/tab-config/useTabConfig.ts';
import { useUrlTab } from '@/app/features/glue/url-tab/useUrlTab.ts';
import { authorizationHooks } from '@/app/platform/core/authorization/authorization-hooks.ts';
import { useAdminAccess } from '@/app/platform/core/authorization/useAdminAccess.ts';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { TabActionsProvider } from '@/app/platform/core/layout/TabActionsContext.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = (t: (k: string) => string) => [
  {
    key: 'tasks',
    label: t('dashboard.tabs.tasks'),
    Component: MyTasksTab,
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
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: authorization,
    error: authorizationError,
    verifyAuthorization,
  } = authorizationHooks();
  const { hasAdminAccess } = useAdminAccess();
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
    TABS(t).find((tb) => tb.key === activeTab)?.Component ?? MyTasksTab;

  const breadcrumbs = useMemo(
    () => [
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

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'settings' as const,
        label: t('tabConfig.configure'),
        onClick: () => setShowTabConfig(true),
      },
      ...(authorization?.authorized
        ? [
            {
              icon: 'plus' as const,
              label: t('tribes.createTribe'),
              onClick: () => navigate('/app/tribes/create'),
            },
          ]
        : []),
      ...(hasAdminAccess
        ? [
            {
              icon: 'settings' as const,
              label: t('common.admin'),
              onClick: () => navigate('/admin'),
            },
          ]
        : []),
    ],
    [authorization?.authorized, hasAdminAccess, t, navigate, setShowTabConfig],
  );

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      breadcrumbTabs={breadcrumbTabs}
      menuActions={menuActions}
      bookmarkSlot={<BookmarkToggle pagePath={location.pathname} pageTitle={t('dashboard.title')} />}
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
      />
      <ActiveComponent />
    </AppLayout>
  );
};

const DashboardPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <TabActionsProvider>
      <DashboardPageContent />
    </TabActionsProvider>
  </ThemeProvider>
);

export default DashboardPage;
