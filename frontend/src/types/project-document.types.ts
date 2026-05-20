import { AttachmentFile } from './document.types';

export interface LabelInfo {
    id: string;
    name: string;
}

export interface ProjectDocumentLabel {
    id: string;
    name: string;
    usage_count: number;
}

export interface ProjectDocumentSummary {
    id: string;
    document_id: string;
    title: string;
    content_summary: string | null;
    labels: LabelInfo[];
    status: string;
    publication_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProjectDocument {
    id: string;
    project_id: string;
    document_id: string;
    title: string;
    content_html: string;
    content_summary: string | null;
    attachments: AttachmentFile[];
    labels: LabelInfo[];
    status: string;
    publication_id: string | null;
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
}

export interface ProjectDocumentUpdate {
    title?: string;
    content_html?: string;
    attachments?: AttachmentFile[];
    label_names?: string[];
}
