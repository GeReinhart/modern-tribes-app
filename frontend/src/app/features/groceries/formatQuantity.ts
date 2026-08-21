export function formatQuantityUnit(quantity: number, unit: string | null, isDivisible: boolean): string {
  const formattedQuantity = isDivisible ? quantity.toFixed(2) : String(quantity);
  return !unit || unit === 'piece' ? formattedQuantity : `${formattedQuantity} ${unit}`;
}

export function formatUnitSuffix(unit: string | null): string {
  return !unit || unit === 'piece' ? '' : `(${unit})`;
}
