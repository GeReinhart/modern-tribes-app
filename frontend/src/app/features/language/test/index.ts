import { registerFeature } from '../../glue/registry.ts';
import TestTab from './TestTab.tsx';

registerFeature({
  feature_type: 'language_test',
  label: 'Language - Test',
  component: TestTab,
});
