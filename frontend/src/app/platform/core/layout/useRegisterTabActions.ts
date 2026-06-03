import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import { useEffect } from 'react';

import { useTabActionsContext } from './TabActionsContext.tsx';

/**
 * Register tab-specific actions into the page menu's tab-actions slot.
 * The caller MUST stabilize `actions` with useMemo to avoid re-registration on every render.
 * Actions are cleared automatically when the component unmounts.
 */
export const useRegisterTabActions = (actions: MenuAction[]): void => {
  const { setTabActionsFromTab } = useTabActionsContext();

  useEffect(() => {
    setTabActionsFromTab(actions);
    return () => setTabActionsFromTab([]);
  }, [actions, setTabActionsFromTab]);
};
