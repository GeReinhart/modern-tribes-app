import { TFunction } from 'i18next';

import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

const GRAMS_PER_KG = 1000;
const COMPACT_UNIT_SYMBOLS: Partial<Record<GroceriesUnit, string>> = { gram: 'g', kg: 'kg', liter: 'L' };

function formatDivisibleQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
}

export function translateUnit(unit: string, t: TFunction, count = 1): string {
  return (GROCERIES_UNITS as readonly string[]).includes(unit)
    ? t(`features.groceries.unit.${unit as GroceriesUnit}`, { count })
    : unit;
}

// Weight items are stored as either grams or kilograms, but a quantity is always displayed with
// whichever of the two keeps the number under 1000 — 1500g reads as "1.5kg", 0.5kg reads as "500g".
function normalizeWeightForDisplay(quantity: number, unit: string | null): { quantity: number; unit: string | null } {
  if (unit !== 'gram' && unit !== 'kg') return { quantity, unit };
  const grams = unit === 'gram' ? quantity : quantity * GRAMS_PER_KG;
  return grams < GRAMS_PER_KG ? { quantity: grams, unit: 'gram' } : { quantity: grams / GRAMS_PER_KG, unit: 'kg' };
}

export function formatQuantityUnit(quantity: number, unit: string | null, isDivisible: boolean, t: TFunction): string {
  const { quantity: displayQuantity, unit: displayUnit } = normalizeWeightForDisplay(quantity, unit);
  const formattedQuantity = isDivisible ? formatDivisibleQuantity(displayQuantity) : String(displayQuantity);
  if (!displayUnit || displayUnit === 'piece') return formattedQuantity;
  const symbol = COMPACT_UNIT_SYMBOLS[displayUnit as GroceriesUnit] ?? translateUnit(displayUnit, t, displayQuantity);
  return `${formattedQuantity}${symbol}`;
}

export function formatUnitSuffix(unit: string | null, t: TFunction): string {
  return !unit || unit === 'piece' ? '' : `(${translateUnit(unit, t)})`;
}
