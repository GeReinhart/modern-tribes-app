import { registerFeature } from '../../glue/registry.ts';
import MetronomeTab from './MetronomeTab.tsx';

registerFeature({
  feature_type: 'guitar_metronome',
  label: 'Guitar Metronome',
  component: MetronomeTab,
});
