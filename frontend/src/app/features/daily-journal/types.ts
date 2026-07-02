export interface JournalBlock {
  id: string;
  feature_instance_id: string;
  date: string;
  document_id: string | null;
  position: number;
  content_html: string | null;
  content_summary: string | null;
  label_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface JournalBlockCreate {
  feature_instance_id: string;
  date: string;
  position: number;
  content_html: string;
}

export interface JournalBlockUpdate {
  content_html?: string;
}

export interface JournalBlockReorder {
  feature_instance_id: string;
  date: string;
  ordered_ids: string[];
}

export interface JournalLabel {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface JournalLabelCreate {
  feature_instance_id: string;
  name: string;
  color: string;
}

export interface JournalLabelUpdate {
  name?: string;
  color?: string;
}

export interface JournalDashboardEntry {
  feature_instance_id: string;
  feature_instance_name: string;
  project_id: string;
  project_name: string;
  tribe_id: string;
  block_count: number;
}

export interface JournalDashboardResponse {
  journals: JournalDashboardEntry[];
}
