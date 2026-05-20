import { registerFeature } from '../registry';
import KanbanTab from './KanbanTab';

registerFeature({
    feature_type: 'kanban',
    label: 'Kanban',
    component: KanbanTab,
});
