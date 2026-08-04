import { registerFeature } from '../../glue/registry.ts';
import SongsTab from './SongsTab.tsx';

registerFeature({
  feature_type: 'guitar_song',
  label: 'Guitar Song',
  component: SongsTab,
});
