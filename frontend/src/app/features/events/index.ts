import { registerFeature } from '../glue/registry.ts';
import EventsTab from './EventsTab.tsx';

registerFeature({
  feature_type: 'events',
  label: 'Events',
  component: EventsTab,
});
