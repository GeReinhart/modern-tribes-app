export interface SearchResult {
  entity_id: string;
  entity_type: string;
  headline: string;
  content_summary: string | null;
  routing_path: string;
  tribe_name: string | null;
  project_name: string | null;
}
