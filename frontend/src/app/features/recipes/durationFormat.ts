type Translate = (key: string, options?: Record<string, unknown>) => string;

// Renders a minute count as "45 min", "2h" or "1h15" depending on i18n conventions, so recipe
// times read naturally instead of always showing raw minutes (e.g. "135 min").
export function formatDurationMinutes(minutes: number, t: Translate): string {
  if (minutes < 60) return t('features.recipes.minutesShort', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return t('features.recipes.hoursShort', { count: hours });
  return t('features.recipes.hoursMinutesShort', { hours, minutes: String(remainder).padStart(2, '0') });
}
