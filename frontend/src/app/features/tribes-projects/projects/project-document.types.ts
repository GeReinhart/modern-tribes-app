import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';
import { LabelInfo } from '@/app/platform/functions/labels/label.types.ts';

export type { LabelInfo };

export interface ProjectDocumentLabel {
  id: string;
  name: string;
  usage_count: number;
}

export interface ProjectDocumentSummary {
  id: string;
  url_param_id: string;
  document_id: string;
  title: string;
  content_summary: string | null;
  labels: LabelInfo[];
  status: string;
  publication_url_param_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProjectDocument {
  id: string;
  url_param_id: string;
  project_id: string;
  document_id: string;
  title: string;
  content_html: string;
  content_summary: string | null;
  attachments: AttachmentFile[];
  labels: LabelInfo[];
  toc_depth: number;
  status: string;
  publication_url_param_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProjectDocumentCreate {
  title: string;
  content_html: string;
  attachments: AttachmentFile[];
  label_names: string[];
  toc_depth?: number;
}

export interface ProjectDocumentUpdate {
  title?: string;
  content_html?: string;
  attachments?: AttachmentFile[];
  label_names?: string[];
  toc_depth?: number;
}
