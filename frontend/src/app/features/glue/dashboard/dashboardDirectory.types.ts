export interface ProjectDirectoryEntry {
  project_id: string;
  project_url_param_id: string;
  project_name: string;
  tribe_url_param_id: string;
  tribe_name: string;
  open_task_count: number;
  upcoming_event_count: number;
}

export interface TaskInstanceDirectoryEntry {
  feature_instance_id: string;
  feature_type: string;
  instance_name: string | null;
  project_url_param_id: string;
  project_name: string;
  tribe_url_param_id: string;
  tribe_name: string;
  open_count: number;
}

export interface EventInstanceDirectoryEntry {
  feature_instance_id: string;
  instance_name: string | null;
  project_url_param_id: string;
  project_name: string;
  tribe_url_param_id: string;
  tribe_name: string;
  upcoming_count: number;
}

export interface DashboardDirectoryResponse {
  projects: ProjectDirectoryEntry[];
  task_instances: TaskInstanceDirectoryEntry[];
  event_instances: EventInstanceDirectoryEntry[];
}
