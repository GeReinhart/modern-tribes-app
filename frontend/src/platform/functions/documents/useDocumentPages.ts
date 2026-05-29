import { useCallback, useEffect, useState } from 'react';

import { documentPageService } from '@/services/document-page.service.ts';
import { DocumentPage } from '@/types/document-page.types.ts';

export function useDocumentPages(
  projectId: string | null,
  projectDocumentId: string | null,
) {
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!projectId || !projectDocumentId) return;
    setLoading(true);
    setError(null);
    documentPageService
      .list(projectId, projectDocumentId)
      .then((data) => setPages(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, projectDocumentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { pages, loading, error, refetch: fetch };
}

export function useDocumentPage(
  projectId: string | null,
  projectDocumentId: string | null,
  pageId: string | null,
) {
  const [page, setPage] = useState<DocumentPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !projectDocumentId || !pageId) return;
    setLoading(true);
    setError(null);
    documentPageService
      .get(projectId, projectDocumentId, pageId)
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, projectDocumentId, pageId]);

  return { page, loading, error };
}
