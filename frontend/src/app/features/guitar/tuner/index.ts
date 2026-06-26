import { registerFeature } from '../../glue/registry.ts';
import TunerTab from './TunerTab.tsx';

registerFeature({
  feature_type: 'guitar_tuner',
  label: 'Guitar Tuner',
  component: TunerTab,
});
