import { registerFeature } from '../../glue/registry.ts';
import NotesTab from './NotesTab.tsx';

registerFeature({
  feature_type: 'guitar_notes',
  label: 'Guitar Notes',
  component: NotesTab,
});
