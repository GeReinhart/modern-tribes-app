const pad = (n: number) => String(n).padStart(2, '0');

export function isoToLocalDt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Accepts YYYY-MM-DD or YYYY-MM-DDTHH:MM; returns e.g. "Jeudi 25/06/2026"
export function fmtDateWithDay(dtStr: string, locale: string): string {
  const [y, m, d] = dtStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${pad(d)}/${pad(m)}/${y}`;
}
