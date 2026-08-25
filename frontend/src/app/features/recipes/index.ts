import { registerFeature } from '../glue/registry.ts';
import RecipesTab from './RecipesTab.tsx';

registerFeature({
  feature_type: 'recipes',
  label: 'Recipes',
  component: RecipesTab,
});
