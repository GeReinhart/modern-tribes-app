import { AttachmentFile } from "@/types/document.types.ts";

export interface PositionData {
    person_id: string;
    position: 'chief' | 'member' | 'guest';
}

export interface PersonWithPosition {
    id: string;
    first_name: string;
    last_name: string;
    gender: string;
    document_id?: string | null;
    position: 'chief' | 'member' | 'guest';
    position_id: string;
    created_at: string;
    updated_at: string;
}

export interface TribeWithPositionsCreate {
    name: string;
    document_content_html: string;
    document_attachments: AttachmentFile[];
    positions: PositionData[];
}

export interface TribeWithPositionsUpdate {
    name?: string;
    document_content_html?: string;
    document_attachments?: AttachmentFile[];
    positions?: PositionData[];
}

export interface TribeWithPositionsResponse {
    id: string;
    name: string;
    document_id: string;
    document_content_html: string;
    document_attachments: AttachmentFile[];
    project_ids: string[];
    persons: PersonWithPosition[];
    created_at: string;
    updated_at: string;
}