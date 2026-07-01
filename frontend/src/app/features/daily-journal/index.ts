import { registerFeature } from '../glue/registry.ts';
import JournalTab from './JournalTab.tsx';

registerFeature({
  feature_type: 'daily_journal',
  label: 'Daily Journal',
  component: JournalTab,
});
