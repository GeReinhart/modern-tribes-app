export interface DocumentEntityBase {
  document_id: string;
  project_id?: string | null;
  related_document_id?: string | null;
}

export interface DocumentEntityCreate extends DocumentEntityBase {}

export interface DocumentEntityUpdate {
  document_id?: string;
  project_id?: string | null;
  related_document_id?: string | null;
}

export interface DocumentEntity extends DocumentEntityBase {
  id: string;
  created_at: string;
  updated_at: string;
}
