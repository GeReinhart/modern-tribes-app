import { MenuAction } from './menu.types.ts';
import { ToolbarActionPlacement, ToolbarConfigOverrides } from './toolbarConfig.types.ts';

export interface ToolbarLayout {
  directTabActions: MenuAction[];
  directPageActions: MenuAction[];
  overflowActions: MenuAction[];
}

const AUTO_COLLAPSE_THRESHOLD = 4;

// Tab actions default to always-direct; page actions default to direct only while the combined
// total stays within the threshold — either default can be overridden by the user per action.
function defaultPlacement(isPageAction: boolean, total: number): ToolbarActionPlacement {
  if (!isPageAction) return 'direct';
  return total > AUTO_COLLAPSE_THRESHOLD ? 'menu' : 'direct';
}

export function getEffectivePlacement(
  actionId: string, isPageAction: boolean, total: number, overrides: ToolbarConfigOverrides,
): ToolbarActionPlacement {
  return overrides[actionId] ?? defaultPlacement(isPageAction, total);
}

export function computeToolbarLayout(
  tabActions: MenuAction[], pageActions: MenuAction[], overrides: ToolbarConfigOverrides,
): ToolbarLayout {
  const total = tabActions.length + pageActions.length;
  const placementOf = (action: MenuAction, isPageAction: boolean) =>
    getEffectivePlacement(action.id, isPageAction, total, overrides);

  const directTabActions = tabActions.filter((a) => placementOf(a, false) === 'direct');
  const directPageActions = pageActions.filter((a) => placementOf(a, true) === 'direct');
  const overflowActions = [
    ...tabActions.filter((a) => placementOf(a, false) === 'menu'),
    ...pageActions.filter((a) => placementOf(a, true) === 'menu'),
  ];

  return { directTabActions, directPageActions, overflowActions };
}
