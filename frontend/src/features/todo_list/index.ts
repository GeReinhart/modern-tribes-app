import { registerFeature } from '../registry';
import TodoListTab from './TodoListTab';

registerFeature({
    feature_type: 'todo_list',
    label: 'Todo List',
    component: TodoListTab,
});
