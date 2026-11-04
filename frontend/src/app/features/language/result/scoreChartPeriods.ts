// The durations the results charts can be reduced to; `days: null` shows the whole history.
export const CHART_PERIODS = [
  { key: 'week', days: 7 },
  { key: 'month', days: 30 },
  { key: 'threeMonths', days: 90 },
  { key: 'all', days: null },
] as const;

export type ChartPeriodKey = (typeof CHART_PERIODS)[number]['key'];

export function itemsInPeriod<T extends { date: string }>(items: T[], days: number | null, today = new Date()): T[] {
  if (days === null) return items;
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  const fromIso = from.toISOString().slice(0, 10);
  return items.filter((item) => item.date >= fromIso);
}
