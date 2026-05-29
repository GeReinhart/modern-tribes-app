import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';

export interface ProjectWithDocumentCreate {
  tribe_id: string;
  name: string;
  document_content_html: string;
  document_attachments: AttachmentFile[];
}

export interface ProjectWithDocumentUpdate {
  name?: string;
  document_content_html?: string;
  document_attachments?: AttachmentFile[];
}

export interface ProjectWithDocumentResponse {
  id: string;
  url_param_id: string;
  name: string;
  document_id: string | null;
  document_content_html: string;
  document_attachments: AttachmentFile[];
  status: string;
  created_at: string;
  updated_at: string;
}
