import { RecipeIngredient } from './types.ts';

interface AdjacentIngredients {
  moved: RecipeIngredient;
  neighbor: RecipeIngredient;
}

export type IngredientGroupKey = 'condiment' | 'accompaniment' | 'main';

// Condiment (derived from the linked catalog item's section) takes priority over the manual
// accompaniment flag, so an ingredient only ever displays in one of the three groups.
export function ingredientGroupKey(ingredient: RecipeIngredient): IngredientGroupKey {
  if (ingredient.is_condiment) return 'condiment';
  if (ingredient.is_accompaniment) return 'accompaniment';
  return 'main';
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
