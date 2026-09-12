import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { useTabActionsContext } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { useToolbarPlacement } from '@/app/platform/core/layout/ToolbarPlacementContext.tsx';
import { computeToolbarLayout, getEffectivePlacement } from '@/app/platform/core/layout/toolbarLayout.ts';
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
    () => (tabTypeKey ? { id: 'toolbar.configure', icon: 'settings' as const, label: t('layout.toolbarConfigure'), onClick: onOpen } : null),
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
  const placementOf = useCallback(
    (actionId: string) => getEffectivePlacement(actionId, !tabActionIds.has(actionId), total, overrides),
    [tabActionIds, total, overrides],
  );

  return {
    theme,
    headerVisible,
    toolbarPlacement,
    mergedTabActions,
    toolbarLayout,
    // The "configure toolbar" action itself is excluded — no point letting the user bury the
    // only entry point to this picker inside the overflow menu it controls.
    configurableActions: [...(tabActions ?? []), ...tabActionsFromTab, ...pageActions],
    placementOf,
    setPlacement,
    configureModalOpen,
    closeConfigureModal: () => setConfigureModalOpen(false),
  };
};
