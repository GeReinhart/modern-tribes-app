import type { GroceriesUnit } from '@/types/groceries.ts';

export function formatQuantityUnit(quantity: number, unit: GroceriesUnit): string {
  return unit === 'piece' ? String(quantity) : `${quantity} ${unit}`;
}

export function formatUnitSuffix(unit: GroceriesUnit): string {
  return unit === 'piece' ? '' : `(${unit})`;
}
