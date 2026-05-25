export type { PersonOption } from '@/types/features';
export { FIBONACCI, fibColor } from '@/types/features';

export interface TodoLabel {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface TodoLabelCreate {
  feature_instance_id: string;
  name: string;
  color: string;
}

export interface TodoLabelUpdate {
  name?: string;
  color?: string;
}

export interface TodoItem {
  id: string;
  feature_instance_id: string;
  title: string;
  status: 'pending' | 'active' | 'archived';
  todo_status: 'todo' | 'done';
  document_id: string | null;
  document_content_html: string | null;
  position: number;
  size: number | null;
  due_date: string | null;
  assigned_person_id: string | null;
  assigned_person_name: string | null;
  label_ids: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TodoItemCreate {
  feature_instance_id: string;
  title: string;
  position?: number;
}

export interface TodoItemUpdate {
  title?: string;
  status?: string;
  todo_status?: string;
  position?: number;
  document_content_html?: string;
  size?: number | null;
  clear_size?: boolean;
  assigned_person_id?: string | null;
  clear_assignee?: boolean;
  due_date?: string | null;
  clear_due_date?: boolean;
}
