import { FIB_COLORS, URGENCY_COLORS } from '@/components/themes/themes';

export interface PersonOption {
  id: string;
  name: string;
}

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

export function fibColor(size: number | null): string {
  if (size === null) return '';
  const idx = FIBONACCI.indexOf(size as (typeof FIBONACCI)[number]);
  return idx === -1 ? '' : (FIB_COLORS[idx] ?? '');
}

export function urgencyColor(
  dueDate: string | null,
  size: number | null,
): string {
  if (!dueDate) return '';
  const today = new Date(new Date().toDateString());
  const due = new Date(dueDate + 'T00:00:00');
  const days = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return URGENCY_COLORS[4];
  const urgency = (size ?? 1) / (days + 1);
  if (urgency < 0.3) return URGENCY_COLORS[0];
  if (urgency < 0.8) return URGENCY_COLORS[1];
  if (urgency < 2) return URGENCY_COLORS[2];
  if (urgency < 5) return URGENCY_COLORS[3];
  return URGENCY_COLORS[4];
}
