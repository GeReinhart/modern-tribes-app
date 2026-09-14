import { MenuAction } from './menu.types.ts';
import { ToolbarActionPlacement, ToolbarConfigOverrides, TOOLBAR_CONFIGURE_ACTION_ID } from './toolbarConfig.types.ts';

export interface ToolbarLayout {
  directTabActions: MenuAction[];
  directPageActions: MenuAction[];
  overflowActions: MenuAction[];
}

const AUTO_COLLAPSE_THRESHOLD = 4;

// Page actions, and tab actions when there are no page actions alongside them, default to direct
// only while the combined total stays within the threshold. Tab actions mixed with page actions
// default to always-direct instead (the page-action count already drives the collapse). The
// "configure toolbar" action itself defaults into the menu. Any default can be overridden by the
// user per action.
function defaultPlacement(actionId: string, isPageAction: boolean, total: number, hasPageActions: boolean): ToolbarActionPlacement {
  if (actionId === TOOLBAR_CONFIGURE_ACTION_ID) return 'menu';
  if (!isPageAction && hasPageActions) return 'direct';
  return total > AUTO_COLLAPSE_THRESHOLD ? 'menu' : 'direct';
}

export function getEffectivePlacement(
  actionId: string, isPageAction: boolean, total: number, hasPageActions: boolean, overrides: ToolbarConfigOverrides,
): ToolbarActionPlacement {
  return overrides[actionId] ?? defaultPlacement(actionId, isPageAction, total, hasPageActions);
}

export function computeToolbarLayout(
  tabActions: MenuAction[], pageActions: MenuAction[], overrides: ToolbarConfigOverrides,
): ToolbarLayout {
  const total = tabActions.length + pageActions.length;
  const hasPageActions = pageActions.length > 0;
  const placementOf = (action: MenuAction, isPageAction: boolean) =>
    getEffectivePlacement(action.id, isPageAction, total, hasPageActions, overrides);

  const directTabActions = tabActions.filter((a) => placementOf(a, false) === 'direct');
  const directPageActions = pageActions.filter((a) => placementOf(a, true) === 'direct');
  const overflowActions = [
    ...tabActions.filter((a) => placementOf(a, false) === 'menu'),
    ...pageActions.filter((a) => placementOf(a, true) === 'menu'),
  ];

  return { directTabActions, directPageActions, overflowActions };
}
