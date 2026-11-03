// The last row of a lookup list is not a result: it triggers the online search. Lists add this
// marker after their results and render it with OnlineSearchRow.
export const ONLINE_ROW = 'online-row';

export type WithOnlineRow<T> = T | typeof ONLINE_ROW;

export function isOnlineRow<T>(row: WithOnlineRow<T>): row is typeof ONLINE_ROW {
  return row === ONLINE_ROW;
}

export function withOnlineRow<T>(items: T[] | null, enabled: boolean): WithOnlineRow<T>[] | null {
  return items && enabled ? [...items, ONLINE_ROW] : items;
}
