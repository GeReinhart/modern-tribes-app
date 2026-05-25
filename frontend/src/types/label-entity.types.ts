export interface LabelEntityBase {
  label_id: string;
  person_id?: string | null;
  project_id?: string | null;
  document_id?: string | null;
}

export interface LabelEntityCreate extends LabelEntityBase {}

export interface LabelEntityUpdate {
  label_id?: string;
  person_id?: string | null;
  project_id?: string | null;
  document_id?: string | null;
}

export interface LabelEntity extends LabelEntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}
