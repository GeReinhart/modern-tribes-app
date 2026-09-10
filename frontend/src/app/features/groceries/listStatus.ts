import { GroceriesList } from './types.ts';

// Ongoing = not archived and not stale: a list whose scheduled date is in the past ('passed')
// no longer counts, even though it's still 'active'/'planned'.
export function isOngoingList(list: GroceriesList): boolean {
  return list.status === 'active' && list.list_status !== 'passed';
}
