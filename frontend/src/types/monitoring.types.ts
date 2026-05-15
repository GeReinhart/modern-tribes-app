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
