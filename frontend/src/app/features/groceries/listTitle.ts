import { TFunction } from 'i18next';

// An untitled list displays as "Next shopping" rather than falling back to its raw date.
export function formatListTitle(name: string | null, t: TFunction): string {
  return name || t('features.groceries.defaultListTitle');
}
