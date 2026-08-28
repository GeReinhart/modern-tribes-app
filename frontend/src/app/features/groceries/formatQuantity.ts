import { TFunction } from 'i18next';

import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

function formatDivisibleQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
}

export function translateUnit(unit: string, t: TFunction, count = 1): string {
  return (GROCERIES_UNITS as readonly string[]).includes(unit)
    ? t(`features.groceries.unit.${unit as GroceriesUnit}`, { count })
    : unit;
}

export function formatQuantityUnit(quantity: number, unit: string | null, isDivisible: boolean, t: TFunction): string {
  const formattedQuantity = isDivisible ? formatDivisibleQuantity(quantity) : String(quantity);
  return !unit || unit === 'piece' ? formattedQuantity : `${formattedQuantity} ${translateUnit(unit, t, quantity)}`;
}

export function formatUnitSuffix(unit: string | null, t: TFunction): string {
  return !unit || unit === 'piece' ? '' : `(${translateUnit(unit, t)})`;
}
