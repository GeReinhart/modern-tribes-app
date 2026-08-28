import { RecipeIngredient } from './types.ts';

interface AdjacentIngredients {
  moved: RecipeIngredient;
  neighbor: RecipeIngredient;
}

// Ingredients are reordered within their own group (main ingredients vs. accompaniments) only —
// the two groups are always displayed as separate blocks, so moving across groups would have no
// visible effect and is instead done via the accompaniment toggle.
export function findAdjacentIngredientInGroup(
  ingredients: RecipeIngredient[], ingredientId: string, direction: 'up' | 'down',
): AdjacentIngredients | null {
  const moved = ingredients.find((i) => i.id === ingredientId);
  if (!moved) return null;
  const group = ingredients
    .filter((i) => i.is_accompaniment === moved.is_accompaniment)
    .sort((a, b) => a.position - b.position);
  const index = group.findIndex((i) => i.id === ingredientId);
  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= group.length) return null;
  return { moved, neighbor: group[neighborIndex] };
}
