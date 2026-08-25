const pad = (n: number) => String(n).padStart(2, '0');

// Formats a local Date's own year/month/day, never round-tripping through
// UTC (Date#toISOString would shift the date backward by a day in any
// timezone ahead of UTC, since local midnight is still "yesterday" in UTC).
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Formats an ISO instant as a local naive "YYYY-MM-DDTHH:MM" string, e.g. to
// pre-fill a datetime-local input or to compare local dates.
export function isoToLocalDt(iso: string): string {
  const d = new Date(iso);
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Returns the 7 ISO dates (Monday first) of the week containing selectedDate.
export function getWeekDates(selectedDate: string): string[] {
  const [y, m, d] = selectedDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    return isoDate(day);
  });
}
