export interface SearchResult {
    document_id: string;
    headline: string;
    content_summary: string | null;
    tribe_id: string | null;
    tribe_name: string | null;
    project_id: string | null;
    project_name: string | null;
    page_id: string | null;
    project_document_id: string | null;
}
