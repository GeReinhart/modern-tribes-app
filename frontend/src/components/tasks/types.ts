import type { PersonOption } from '@/types/features';

export type { PersonOption };

export interface TaskLabelInfo {
  id: string;
  feature_instance_id: string;
  name: string;
  color: string;
}

export interface TaskPatch {
  title?: string;
  size?: number;
  clear_size?: boolean;
  due_date?: string;
  clear_due_date?: boolean;
  assigned_person_id?: string;
  clear_assignee?: boolean;
  document_content_html?: string;
}

export interface TaskEditValue {
  id: string;
  feature_instance_id: string;
  title: string;
  size: number | null;
  due_date: string | null;
  assigned_person_id: string | null;
  document_content_html: string | null;
  label_ids: string[];
}

export interface TaskItemModalProps {
  value: TaskEditValue;
  labels: TaskLabelInfo[];
  persons: PersonOption[];
  canEdit: boolean;
  canCreateLabel: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: TaskPatch) => Promise<void>;
  onToggleLabel: (
    id: string,
    labelId: string,
    currentLabelIds: string[],
  ) => Promise<void>;
  onCreateLabel: (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }) => Promise<TaskLabelInfo | null>;
}
