import { registerFeature } from '../../glue/registry.ts';
import ResultTab from './ResultTab.tsx';

registerFeature({
  feature_type: 'language_result',
  label: 'Language - Result',
  component: ResultTab,
});
