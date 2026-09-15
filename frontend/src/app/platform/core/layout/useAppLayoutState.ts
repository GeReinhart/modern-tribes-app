import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { derivePageKey } from '@/app/platform/core/layout/derivePageKey.ts';
import { useTabActionsContext } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { useToolbarPlacement } from '@/app/platform/core/layout/ToolbarPlacementContext.tsx';
import { computeToolbarLayout, getEffectivePlacement } from '@/app/platform/core/layout/toolbarLayout.ts';
import { TOOLBAR_CONFIGURE_ACTION_ID } from '@/app/platform/core/layout/toolbarConfig.types.ts';
import { useToolbarConfig } from '@/app/platform/core/layout/useToolbarConfig.ts';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface UseAppLayoutStateParams {
  menuActions?: MenuAction[];
  tabActions?: MenuAction[];
}

// Every page gets the "configure toolbar" action -- tabbed pages key their layout by tab type
// (set by a TabActionsProvider ancestor, e.g. ShowProjectPage/DashboardPage); a standalone page
// has no such provider, so it falls back to a key derived from its own route instead, keeping
// the same "remembered per page" behavior application.json promises everywhere.
function useEffectiveToolbarKey(tabTypeKey: string | null): string {
  const location = useLocation();
  return tabTypeKey ?? derivePageKey(location.pathname);
}

function useConfigureToolbarAction(toolbarKey: string, onOpen: () => void): MenuAction {
  const { t } = useTranslation();
  return useMemo(
    () => ({ id: TOOLBAR_CONFIGURE_ACTION_ID, icon: 'settings' as const, label: t('layout.toolbarConfigure'), onClick: onOpen }),
    [toolbarKey, t, onOpen],
  );
}

export const useAppLayoutState = ({ menuActions, tabActions }: UseAppLayoutStateParams) => {
  const { theme } = useTheme();
  const { chromeHidden } = useChromeVisibility();
  const headerVisible = !chromeHidden;
  const { toolbarPlacement } = useToolbarPlacement();
  const { tabActionsFromTab, tabTypeKey } = useTabActionsContext();
  const toolbarKey = useEffectiveToolbarKey(tabTypeKey);
  const { overrides, setPlacement } = useToolbarConfig(toolbarKey);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

  const configureAction = useConfigureToolbarAction(toolbarKey, () => setConfigureModalOpen(true));
  const mergedTabActions = useMemo(
    () => [...(tabActions ?? []), ...tabActionsFromTab, configureAction],
    [tabActions, tabActionsFromTab, configureAction],
  );
  const pageActions = menuActions ?? [];

  const toolbarLayout = useMemo(
    () => computeToolbarLayout(mergedTabActions, pageActions, overrides),
    [mergedTabActions, pageActions, overrides],
  );

  const tabActionIds = useMemo(() => new Set(mergedTabActions.map((a) => a.id)), [mergedTabActions]);
  const total = mergedTabActions.length + pageActions.length;
  const hasPageActions = pageActions.length > 0;
  const placementOf = useCallback(
    (actionId: string) => getEffectivePlacement(actionId, !tabActionIds.has(actionId), total, hasPageActions, overrides),
    [tabActionIds, total, hasPageActions, overrides],
  );

  return {
    theme,
    headerVisible,
    toolbarPlacement,
    mergedTabActions,
    toolbarLayout,
    configurableActions: [...(tabActions ?? []), ...tabActionsFromTab, configureAction, ...pageActions],
    placementOf,
    setPlacement,
    configureModalOpen,
    closeConfigureModal: () => setConfigureModalOpen(false),
  };
};
