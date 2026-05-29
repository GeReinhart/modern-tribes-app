import { registerFeature } from '../../glue/registry.ts';
import TodoListTab from './TodoListTab.tsx';

registerFeature({
  feature_type: 'todo_list',
  label: 'Todo List',
  component: TodoListTab,
});
