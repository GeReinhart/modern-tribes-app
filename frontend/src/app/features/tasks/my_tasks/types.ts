export interface MyTaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface MyTaskBase {
  id: string;
  title: string;
  size: number | null;
  due_date: string;
  assigned_person_id: string | null;
  assigned_person_name: string | null;
  feature_instance_id: string;
  feature_instance_name: string;
  project_id: string;
  project_name: string;
  tribe_id: string | null;
  tribe_name: string | null;
  label_ids: string[];
  labels: MyTaskLabel[];
  document_content_html: string | null;
}

export interface MyKanbanTask extends MyTaskBase {
  source: 'kanban';
  column_id: string;
  column_name: string;
}

export interface MyTodoTask extends MyTaskBase {
  source: 'todo';
  todo_status: string;
}

export type MyTask = MyKanbanTask | MyTodoTask;

export interface MyTasksResponse {
  kanban: MyKanbanTask[];
  todo: MyTodoTask[];
}

export interface MyTasksFilters {
  tribe_id?: string;
  project_id?: string;
  person_id?: string;
  label_id?: string;
}
