import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import DashboardBookmarksTab from '@/app/features/bookmarks/DashboardBookmarksTab.tsx';
import MyTasksTab from '@/app/features/tasks/my_tasks/MyTasksTab.tsx';
import DashboardTribesTab from '@/app/features/glue/dashboard/tabs/DashboardTribesTab.tsx';
import DashboardPlanningTab from '@/app/features/glue/dashboard/tabs/DashboardPlanningTab.tsx';
import DashboardProjectsTab from '@/app/features/glue/dashboard/tabs/DashboardProjectsTab.tsx';
import DashboardTaskInstancesTab from '@/app/features/glue/dashboard/tabs/DashboardTaskInstancesTab.tsx';
import DashboardEventInstancesTab from '@/app/features/glue/dashboard/tabs/DashboardEventInstancesTab.tsx';
import { TabEditPopup } from '@/app/features/glue/tab-config/TabEditPopup.tsx';
import { useTabConfig } from '@/app/features/glue/tab-config/useTabConfig.ts';
import { useTabEditMode } from '@/app/features/glue/tab-config/useTabEditMode.ts';
import { QuickAddDefaultsPopup } from '@/app/features/glue/dashboard/QuickAddDefaultsPopup.tsx';
import { useUrlTab } from '@/app/features/glue/url-tab/useUrlTab.ts';
import { authorizationHooks } from '@/app/platform/core/authorization/authorization-hooks.ts';
import { useAdminAccess } from '@/app/platform/core/authorization/useAdminAccess.ts';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { TabActionsProvider } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { PinnedBookmarkTab } from '@/app/features/glue/dashboard/PinnedBookmarkTab.tsx';
import { PinnedTabsProvider, usePinnedTabsContext } from '@/app/features/glue/dashboard/PinnedTabsContext.tsx';
import {
  makePinnedTabKey,
  makeUnpinHandler,
  parsePinnedTabKey,
  parseProjectFeaturePath,
} from '@/app/features/glue/dashboard/pinnedTabs.types.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const STATIC_TABS = (t: (k: string) => string) => [
  { key: 'tasks', label: t('dashboard.tabs.tasks'), Component: MyTasksTab },
  { key: 'tribes', label: t('dashboard.tabs.tribes'), Component: DashboardTribesTab },
  { key: 'bookmarks', label: t('dashboard.tabs.bookmarks'), Component: DashboardBookmarksTab },
  { key: 'planning', label: t('dashboard.tabs.planning'), Component: DashboardPlanningTab },
  { key: 'projects', label: t('dashboard.tabs.projects'), Component: DashboardProjectsTab },
  { key: 'task-instances', label: t('dashboard.tabs.taskInstances'), Component: DashboardTaskInstancesTab },
  { key: 'event-instances', label: t('dashboard.tabs.eventInstances'), Component: DashboardEventInstancesTab },
];

const DashboardPageContent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    data: authorization,
    error: authorizationError,
    verifyAuthorization,
  } = authorizationHooks();
  const { hasAdminAccess } = useAdminAccess();
  const [showQuickAddDefaults, setShowQuickAddDefaults] = useState(false);
  const { pinnedTabs, unpin } = usePinnedTabsContext();

  const allTabs = useMemo(() => {
    const staticTabs = STATIC_TABS(t).map(({ key, label }) => ({ key, label }));
    const dynamicTabs = pinnedTabs.map((pt) => ({
      key: makePinnedTabKey(pt.bookmark_id),
      label: pt.page_title,
    }));
    return [...staticTabs, ...dynamicTabs];
  }, [t, pinnedTabs]);

  const { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig } =
    useTabConfig('dashboard', allTabs);
  const { activeTab, breadcrumbTabs, handleTabChange, navTabs } = useUrlTab(
    visibleTabs,
    '/app/dashboard',
    defaultTabKey,
  );

  const { tabEditMode, editingTabKey, setEditingTabKey, hiddenTabs, toggleTabEditMode } =
    useTabEditMode(tabsWithConfig);

  const breadcrumbs = useMemo(() => [{ label: t('dashboard.title') }], [t]);

  useEffect(() => {
    verifyAuthorization(['admin', 'can_create_own_tribes']).catch((err) => {
      console.error('Authorization check failed:', err);
    });
  }, [verifyAuthorization]);

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: tabEditMode ? ('x' as const) : ('settings' as const),
        label: tabEditMode ? t('tabConfig.finishConfigure') : t('tabConfig.configure'),
        onClick: toggleTabEditMode,
      },
      {
        icon: 'zap' as const,
        label: t('dashboard.quickAddDefaults.menuLabel'),
        onClick: () => setShowQuickAddDefaults(true),
      },
      ...(authorization?.authorized
        ? [{ icon: 'plus' as const, badgeIcon: 'users' as const, label: t('tribes.createTribe'), path: '/app/tribes/create' }]
        : []),
      ...(hasAdminAccess
        ? [{ icon: 'shield' as const, label: t('common.admin'), path: '/admin' }]
        : []),
    ],
    [authorization?.authorized, hasAdminAccess, tabEditMode, toggleTabEditMode, t],
  );

  const activeStaticTab = STATIC_TABS(t).find((tb) => tb.key === activeTab);
  const activePinnedBookmarkId = parsePinnedTabKey(activeTab);
  const activePinnedTab = activePinnedBookmarkId
    ? pinnedTabs.find((pt) => pt.bookmark_id === activePinnedBookmarkId)
    : null;
  const activePinnedPathParams = activePinnedTab
    ? parseProjectFeaturePath(activePinnedTab.page_path)
    : null;

  const pinnedTabKeySet = useMemo(
    () => new Set(pinnedTabs.map((pt) => makePinnedTabKey(pt.bookmark_id))),
    [pinnedTabs],
  );

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      breadcrumbTabs={breadcrumbTabs}
      menuActions={menuActions}
      bookmarkSlot={
        <BookmarkToggle
          pagePath={location.pathname}
          pageTitle={t('dashboard.title')}
          pageDescription={buildBookmarkDescription(breadcrumbs)}
        />
      }
    >
      {editingTabKey && (
        <TabEditPopup
          tabKey={editingTabKey}
          tabsWithConfig={tabsWithConfig}
          isPinned={pinnedTabKeySet.has(editingTabKey)}
          onSave={saveConfig}
          onUnpin={makeUnpinHandler(editingTabKey, pinnedTabs, unpin)}
          onClose={() => setEditingTabKey(null)}
        />
      )}

      {showQuickAddDefaults && (
        <QuickAddDefaultsPopup onClose={() => setShowQuickAddDefaults(false)} />
      )}

      {authorizationError && (
        <ThemedCard>
          <div style={errorStyle}>
            <strong>Authorization Error:</strong> {authorizationError.message}
          </div>
        </ThemedCard>
      )}

      <ThemedTabs
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        editMode={tabEditMode}
        hiddenTabs={hiddenTabs}
        onEditTab={setEditingTabKey}
      />

      {activeStaticTab && <activeStaticTab.Component />}

      {activePinnedTab && activePinnedPathParams && (
        <PinnedBookmarkTab
          key={activePinnedTab.id}
          pagePath={activePinnedTab.page_path}
          pathParams={activePinnedPathParams}
          pinnedTabId={activePinnedTab.id}
          onUnpin={unpin}
        />
      )}
    </AppLayout>
  );
};

const DashboardPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <PinnedTabsProvider>
      <TabActionsProvider>
        <DashboardPageContent />
      </TabActionsProvider>
    </PinnedTabsProvider>
  </ThemeProvider>
);

export default DashboardPage;
