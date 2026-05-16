import {BaseEntity} from "@/types/common.types.ts";


export interface Document extends BaseEntity {
    content_html: string;
    content_summary: string | null;
    attachments: AttachmentFile[];
}

export interface DocumentCreate {
    content_html: string;
    attachments: AttachmentFile[];
}

export interface DocumentUpdate {
    content_html?: string;
    attachments?: AttachmentFile[];
    status?: string;
}


export interface AttachmentFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: Date;
}

