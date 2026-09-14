import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { useTabActionsContext } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { useToolbarPlacement } from '@/app/platform/core/layout/ToolbarPlacementContext.tsx';
import { computeToolbarLayout, getEffectivePlacement } from '@/app/platform/core/layout/toolbarLayout.ts';
import { TOOLBAR_CONFIGURE_ACTION_ID } from '@/app/platform/core/layout/toolbarConfig.types.ts';
import { useToolbarConfig } from '@/app/platform/core/layout/useToolbarConfig.ts';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UseAppLayoutStateParams {
  menuActions?: MenuAction[];
  tabActions?: MenuAction[];
}

// Injects the "configure toolbar" action into every tab automatically — only where a tab
// container (ShowProjectPage, DashboardPage) registered a tabTypeKey, so standalone pages
// without tabs never show it.
function useConfigureToolbarAction(tabTypeKey: string | null, onOpen: () => void): MenuAction | null {
  const { t } = useTranslation();
  return useMemo(
    () => (tabTypeKey ? { id: TOOLBAR_CONFIGURE_ACTION_ID, icon: 'settings' as const, label: t('layout.toolbarConfigure'), onClick: onOpen } : null),
    [tabTypeKey, t, onOpen],
  );
}

export const useAppLayoutState = ({ menuActions, tabActions }: UseAppLayoutStateParams) => {
  const { theme } = useTheme();
  const { chromeHidden } = useChromeVisibility();
  const headerVisible = !chromeHidden;
  const { toolbarPlacement } = useToolbarPlacement();
  const { tabActionsFromTab, tabTypeKey } = useTabActionsContext();
  const { overrides, setPlacement } = useToolbarConfig(tabTypeKey);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

  const configureAction = useConfigureToolbarAction(tabTypeKey, () => setConfigureModalOpen(true));
  const mergedTabActions = useMemo(
    () => [...(tabActions ?? []), ...tabActionsFromTab, ...(configureAction ? [configureAction] : [])],
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
    configurableActions: [...(tabActions ?? []), ...tabActionsFromTab, ...(configureAction ? [configureAction] : []), ...pageActions],
    placementOf,
    setPlacement,
    configureModalOpen,
    closeConfigureModal: () => setConfigureModalOpen(false),
  };
};
