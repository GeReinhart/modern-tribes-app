import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

export function formatMealDate(mealStartAt: string, language: string): string {
  const locale = language.startsWith('fr') ? fr : enUS;
  const formatted = format(new Date(mealStartAt), 'EEEE dd/MM/yyyy', { locale });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
