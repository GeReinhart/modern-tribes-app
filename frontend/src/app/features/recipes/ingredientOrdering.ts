import { RecipeIngredient } from './types.ts';

interface AdjacentIngredients {
  moved: RecipeIngredient;
  neighbor: RecipeIngredient;
}

export type IngredientGroupKey = 'condiment' | 'accompaniment' | 'main';

export interface IngredientDisplayGroup {
  title?: string;
  ingredients: RecipeIngredient[];
}

// Condiment (derived from the linked catalog item's section) takes priority over the manual
// accompaniment flag, so an ingredient only ever displays in one of the three groups.
export function ingredientGroupKey(ingredient: RecipeIngredient): IngredientGroupKey {
  if (ingredient.is_condiment) return 'condiment';
  if (ingredient.is_accompaniment) return 'accompaniment';
  return 'main';
}

// Edit mode keeps 3 separate groups (main / condiments / accompaniments) so a manager can see and
// toggle the accompaniment flag directly. The read-only view (presentation/print page) merges
// main + accompaniments into one untitled list and shows condiments last under a mini title —
// IngredientGroupBlock already hides an empty group's title, so no condiments means no title.
export function buildIngredientDisplayGroups(
  ingredients: RecipeIngredient[], canEdit: boolean, groupLabels: { condiments: string; accompaniments: string },
): IngredientDisplayGroup[] {
  const condiments = ingredients.filter((i) => ingredientGroupKey(i) === 'condiment');
  if (!canEdit) {
    const nonCondiments = ingredients.filter((i) => ingredientGroupKey(i) !== 'condiment');
    return [{ ingredients: nonCondiments }, { title: groupLabels.condiments, ingredients: condiments }];
  }
  return [
    { ingredients: ingredients.filter((i) => ingredientGroupKey(i) === 'main') },
    { title: groupLabels.condiments, ingredients: condiments },
    { title: groupLabels.accompaniments, ingredients: ingredients.filter((i) => ingredientGroupKey(i) === 'accompaniment') },
  ];
}

// Ingredients are reordered within their own group (main / accompaniments / condiments) only —
// the groups are always displayed as separate blocks, so moving across groups would have no
// visible effect and is instead done via the accompaniment toggle or the item's catalog section.
export function findAdjacentIngredientInGroup(
  ingredients: RecipeIngredient[], ingredientId: string, direction: 'up' | 'down',
): AdjacentIngredients | null {
  const moved = ingredients.find((i) => i.id === ingredientId);
  if (!moved) return null;
  const group = ingredients
    .filter((i) => ingredientGroupKey(i) === ingredientGroupKey(moved))
    .sort((a, b) => a.position - b.position);
  const index = group.findIndex((i) => i.id === ingredientId);
  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= group.length) return null;
  return { moved, neighbor: group[neighborIndex] };
}
