import { AttachmentFile } from './document.types';

export interface DocumentPageSummary {
  id: string;
  url_param_id: string;
  project_document_id: string;
  title: string;
  content_summary: string | null;
  order_index: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  id: string;
  url_param_id: string;
  project_document_id: string;
  title: string;
  content_html: string;
  content_summary: string | null;
  attachments: AttachmentFile[];
  order_index: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DocumentPageCreate {
  title: string;
  content_html?: string;
  attachments?: AttachmentFile[];
  order_index?: number;
}

export interface DocumentPageUpdate {
  title?: string;
  content_html?: string;
  attachments?: AttachmentFile[];
  order_index?: number;
}

export interface DocumentPageReorderItem {
  page_id: string;
  order_index: number;
}
