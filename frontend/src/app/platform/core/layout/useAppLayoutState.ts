import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { useTabActionsContext } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { useToolbarPlacement } from '@/app/platform/core/layout/ToolbarPlacementContext.tsx';

import { useMemo } from 'react';

interface UseAppLayoutStateParams {
  menuActions?: MenuAction[];
  tabActions?: MenuAction[];
}

export const useAppLayoutState = ({ menuActions, tabActions }: UseAppLayoutStateParams) => {
  const { theme } = useTheme();
  const { chromeHidden } = useChromeVisibility();
  const headerVisible = !chromeHidden;
  const { toolbarPlacement } = useToolbarPlacement();
  const { tabActionsFromTab } = useTabActionsContext();

  const mergedTabActions = useMemo(
    () => [...(tabActions ?? []), ...tabActionsFromTab],
    [tabActions, tabActionsFromTab],
  );
  const toolbarActions = useMemo(
    () => [...(menuActions ?? []), ...mergedTabActions],
    [menuActions, mergedTabActions],
  );

  return {
    theme,
    headerVisible,
    toolbarPlacement,
    mergedTabActions,
    toolbarActions,
  };
};
