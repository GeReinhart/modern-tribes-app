const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
};

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTS,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

const LOCALE = 'fr-FR';

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(LOCALE, DATE_OPTS);
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString(LOCALE, DATETIME_OPTS);
}
