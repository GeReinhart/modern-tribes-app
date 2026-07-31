import { registerFeature } from '../../glue/registry.ts';
import ChordsTab from './ChordsTab.tsx';

registerFeature({
  feature_type: 'guitar_chords',
  label: 'Guitar Chords',
  component: ChordsTab,
});
