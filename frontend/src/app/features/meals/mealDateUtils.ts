export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function combineDateAndTime(dateStr: string, time: string): string {
  return new Date(`${dateStr}T${time}`).toISOString();
}

// A meal's time is simplified to one of 3 daily slots instead of a free start/end time picker —
// each slot still maps to a fixed start/end so start_at/end_at stay ordinary timestamps.
export enum MealSlot {
  morning = 'morning',
  midday = 'midday',
  evening = 'evening',
}

export const MEAL_SLOTS: MealSlot[] = [MealSlot.morning, MealSlot.midday, MealSlot.evening];

const MEAL_SLOT_TIMES: Record<MealSlot, { start: string; end: string }> = {
  [MealSlot.morning]: { start: '08:00', end: '09:00' },
  [MealSlot.midday]: { start: '12:00', end: '13:00' },
  [MealSlot.evening]: { start: '20:00', end: '21:00' },
};

// Buckets a "HH:MM" time of day into the slot it's closest to, so a meal created before this
// simplified picker existed (or with a custom time) still lands in a sensible column/selection.
export function slotFromTime(time: string): MealSlot {
  const hour = Number(time.slice(0, 2));
  if (hour < 11) return MealSlot.morning;
  if (hour < 17) return MealSlot.midday;
  return MealSlot.evening;
}

export function combineDateAndSlot(dateStr: string, slot: MealSlot): { start_at: string; end_at: string } {
  const { start, end } = MEAL_SLOT_TIMES[slot];
  return { start_at: combineDateAndTime(dateStr, start), end_at: combineDateAndTime(dateStr, end) };
}
