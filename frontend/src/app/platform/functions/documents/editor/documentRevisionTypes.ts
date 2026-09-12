// Mirrors the backend's DocumentRevision model, returned by every feature's own
// GET .../document/revisions endpoint (each feature enforces its own access rules before
// calling the shared fetch_document_revisions helper).
export interface DocumentRevision {
  content_html: string;
  updated_at: string;
  updated_by: string | null;
  is_current: boolean;
}
