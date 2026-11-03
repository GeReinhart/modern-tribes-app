import { ScoreHistoryPoint } from './types.ts';

// The durations the score chart can be reduced to; `days: null` shows the whole history.
export const CHART_PERIODS = [
  { key: 'week', days: 7 },
  { key: 'month', days: 30 },
  { key: 'threeMonths', days: 90 },
  { key: 'all', days: null },
] as const;

export type ChartPeriodKey = (typeof CHART_PERIODS)[number]['key'];

export function pointsInPeriod(points: ScoreHistoryPoint[], days: number | null, today = new Date()): ScoreHistoryPoint[] {
  if (days === null) return points;
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  const fromIso = from.toISOString().slice(0, 10);
  return points.filter((point) => point.date >= fromIso);
}
