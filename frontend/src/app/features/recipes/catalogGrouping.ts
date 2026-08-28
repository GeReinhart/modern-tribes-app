import { CatalogItemOption, CatalogSectionOption } from './types.ts';

export interface FoodSectionGroup {
  id: string;
  name: string;
  icon: string | null;
  items: CatalogItemOption[];
}

// Only food sections are shown in the recipe ingredient picker — an item that isn't in any food
// section (no section, or only non-food ones) can't be picked from here.
export function groupCatalogItemsByFoodSection(
  items: CatalogItemOption[], sections: CatalogSectionOption[],
): FoodSectionGroup[] {
  return sections
    .filter((s) => s.is_food)
    .map((s) => ({
      id: s.id, name: s.name, icon: s.icon,
      items: items.filter((i) => i.section_ids.includes(s.id)),
    }))
    .filter((g) => g.items.length > 0);
}
