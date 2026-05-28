import { FIB_COLORS, URGENCY_COLORS } from '@/components/themes/themes';

export interface PersonOption {
  id: string;
  name: string;
}

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

export function fibColor(size: number | null): string {
  if (size === null) return '';
  const idx = FIBONACCI.indexOf(size as (typeof FIBONACCI)[number]);
  return idx === -1 ? '' : (FIB_COLORS[idx] ?? '');
}

export function urgencyColor(dueDate: string | null, size: number | null): string {
  if (!dueDate) return '';
  const today = new Date(new Date().toDateString());
  const due = new Date(dueDate + 'T00:00:00');
  const days = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return URGENCY_COLORS[4];
  const urgency = (size ?? 1) / (days + 1);
  if (urgency < 0.3) return URGENCY_COLORS[0];
  if (urgency < 0.8) return URGENCY_COLORS[1];
  if (urgency < 2) return URGENCY_COLORS[2];
  if (urgency < 5) return URGENCY_COLORS[3];
  return URGENCY_COLORS[4];
}

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
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TaskItemModalProps {
  value: TaskEditValue;
  labels: TaskLabelInfo[];
  persons: PersonOption[];
  canEdit: boolean;
  canCreateLabel: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: TaskPatch) => Promise<void>;
  onToggleLabel: (id: string, labelId: string, currentLabelIds: string[]) => Promise<void>;
  onCreateLabel: (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }) => Promise<TaskLabelInfo | null>;
}
