import { registerFeature } from '../glue/registry.ts';
import MealsTab from './MealsTab.tsx';

registerFeature({
  feature_type: 'meals',
  label: 'Meals',
  component: MealsTab,
});
