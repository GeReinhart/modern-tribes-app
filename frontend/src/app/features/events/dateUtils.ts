export { isoToLocalDt } from '@/app/platform/core/layout/themes/components/calendar/calendarDateUtils.ts';

const pad = (n: number) => String(n).padStart(2, '0');

// Accepts YYYY-MM-DD or YYYY-MM-DDTHH:MM; returns e.g. "Jeudi 25/06/2026"
export function fmtDateWithDay(dtStr: string, locale: string): string {
  const [y, m, d] = dtStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${pad(d)}/${pad(m)}/${y}`;
}

function parseLocalDt(v: string): Date {
  const [d, t = '00:00'] = v.split('T');
  const [y, mo, day] = d.split('-').map(Number);
  const [h, mi] = (t || '00:00').split(':').map(Number);
  return new Date(y, mo - 1, day, h || 0, mi || 0);
}

export function diffMinutes(startAt: string, endAt: string): number {
  return Math.round((parseLocalDt(endAt).getTime() - parseLocalDt(startAt).getTime()) / 60000);
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Formats a duration in minutes, breaking it into days once it reaches 24h.
export function formatDuration(minutes: number, t: TranslateFn): string {
  if (minutes <= 0) return '';
  const totalHours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return t('features.events.durationDays', { days, hours });
  }
  if (totalHours === 0) return `${mins}min`;
  if (mins === 0) return `${totalHours}h`;
  return `${totalHours}h ${mins}min`;
}
