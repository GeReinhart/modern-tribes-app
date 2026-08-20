import { registerFeature } from '../glue/registry.ts';
import GroceriesTab from './GroceriesTab.tsx';

registerFeature({
  feature_type: 'groceries',
  label: 'Groceries',
  component: GroceriesTab,
});
