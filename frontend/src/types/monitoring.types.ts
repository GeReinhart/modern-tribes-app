export interface RecentChange {
    entity: string;
    entity_id: string;
    entity_summary: string | null;
    entity_status: string;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface DocumentRevision {
    content_html: string;
    updated_at: string;
    updated_by: string | null;
    is_current: boolean;
}
