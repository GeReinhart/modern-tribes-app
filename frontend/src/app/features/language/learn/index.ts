import { registerFeature } from '../../glue/registry.ts';
import LearnTab from './LearnTab.tsx';

registerFeature({
  feature_type: 'language_learn',
  label: 'Language - Learn',
  component: LearnTab,
});
