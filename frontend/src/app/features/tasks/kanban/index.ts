import { registerFeature } from '../../glue/registry.ts';
import KanbanTab from './KanbanTab.tsx';

registerFeature({
  feature_type: 'kanban',
  label: 'Kanban',
  component: KanbanTab,
});
