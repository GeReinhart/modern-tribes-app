import { DocumentPage } from './document-page.types';
import { AttachmentFile } from './document.types';
import { LabelInfo } from './project-document.types';

export interface PublicationSummary {
  id: string;
  url_param_id: string;
  document_id: string;
  project_document_id: string;
  title: string;
  content_summary: string | null;
  labels: LabelInfo[];
  published_at: string;
}

export interface PublicationDetail {
  id: string;
  url_param_id: string;
  document_id: string;
  project_document_id: string;
  title: string;
  content_html: string;
  content_summary: string | null;
  labels: LabelInfo[];
  attachments: AttachmentFile[];
  pages: DocumentPage[];
  toc_depth: number;
  published_at: string;
  published_by_login: string | null;
  author_name: string | null;
}

export interface PublicationAdminItem {
  id: string;
  url_param_id: string;
  document_id: string;
  project_document_id: string;
  title: string;
  content_summary: string | null;
  labels: LabelInfo[];
  tribe_id: string;
  tribe_name: string;
  project_id: string;
  project_name: string;
  published_at: string;
  published_by_login: string | null;
}
