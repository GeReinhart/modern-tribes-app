import { GroceriesSection } from './types.ts';

export interface SectionGroup<T> {
  id: string | null;
  name: string;
  icon: string | null;
  items: T[];
}

export function groupBySections<T extends { section_ids: string[] }>(
  items: T[],
  sections: GroceriesSection[],
  uncategorizedLabel: string,
  includeEmptySections = false,
): SectionGroup<T>[] {
  const groups: SectionGroup<T>[] = sections
    .map((s) => ({
      id: s.id, name: s.name, icon: s.icon, items: items.filter((i) => i.section_ids.includes(s.id)),
    }))
    .filter((g) => includeEmptySections || g.items.length > 0);
  const uncategorized = items.filter((i) => i.section_ids.length === 0);
  if (uncategorized.length > 0) {
    groups.push({ id: null, name: uncategorizedLabel, icon: null, items: uncategorized });
  }
  return groups;
}
