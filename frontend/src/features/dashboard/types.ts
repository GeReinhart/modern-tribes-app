export interface DashboardTaskLabel {
    id: string;
    name: string;
    color: string;
}

export interface DashboardTaskBase {
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
    labels: DashboardTaskLabel[];
    document_content_html: string | null;
}

export interface DashboardKanbanTask extends DashboardTaskBase {
    source: 'kanban';
    column_id: string;
    column_name: string;
}

export interface DashboardTodoTask extends DashboardTaskBase {
    source: 'todo';
    todo_status: string;
}

export type DashboardTask = DashboardKanbanTask | DashboardTodoTask;

export interface MyTasksResponse {
    kanban: DashboardKanbanTask[];
    todo: DashboardTodoTask[];
}

export interface MyTasksFilters {
    tribe_id?: string;
    project_id?: string;
    person_id?: string;
    label_id?: string;
}
