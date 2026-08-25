function formatDivisibleQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
}

export function formatQuantityUnit(quantity: number, unit: string | null, isDivisible: boolean): string {
  const formattedQuantity = isDivisible ? formatDivisibleQuantity(quantity) : String(quantity);
  return !unit || unit === 'piece' ? formattedQuantity : `${formattedQuantity} ${unit}`;
}

export function formatUnitSuffix(unit: string | null): string {
  return !unit || unit === 'piece' ? '' : `(${unit})`;
}
