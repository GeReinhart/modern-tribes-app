import type { FeatureLabel } from '@/app/features/tasks/types.ts';
export type { FeatureLabel as KanbanLabel } from '@/app/features/tasks/types.ts';

export interface KanbanColumn {
  id: string;
  name: string;
  position: number;
}

export interface KanbanCard {
  id: string;
  feature_instance_id: string;
  column_id: string;
  title: string;
  assigned_person_id: string | null;
  assigned_person_name: string | null;
  document_id: string | null;
  document_content_html: string | null;
  position: number;
  status: 'pending' | 'active' | 'archived';
  size: number | null;
  due_date: string | null;
  label_ids: string[];
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  labels: FeatureLabel[];
}

export type { PersonOption } from '@/app/features/tasks/types.ts';

export interface CardCreate {
  feature_instance_id: string;
  column_id: string;
  title: string;
  assigned_person_id?: string | null;
  position?: number;
}

export interface CardUpdate {
  title?: string;
  assigned_person_id?: string | null;
  clear_assignee?: boolean;
  document_content_html?: string;
  size?: number | null;
  clear_size?: boolean;
  due_date?: string | null;
  clear_due_date?: boolean;
}

export interface ColumnCreate {
  feature_instance_id: string;
  name: string;
}

export type { FeatureLabelCreate as LabelCreate, FeatureLabelUpdate as LabelUpdate } from '@/app/features/tasks/types.ts';

export type MoveDirection = 'prev' | 'next';
export type ReorderDirection = 'up' | 'down' | 'top' | 'bottom';

export { FIBONACCI, fibColor, urgencyColor } from '@/app/features/tasks/types.ts';
