import { useCallback, useEffect, useState } from 'react';

import { projectDocumentService } from '@/features/tribes-projects/projects/project-document.service.ts';
import {
  ProjectDocument,
  ProjectDocumentLabel,
  ProjectDocumentSummary,
} from '@/types/project-document.types.ts';

export function useProjectDocuments(
  projectId: string | null,
  q?: string,
  labelId?: string,
) {
  const [documents, setDocuments] = useState<ProjectDocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    projectDocumentService
      .list(projectId, q, labelId)
      .then((data) => setDocuments(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, q, labelId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { documents, loading, error, refetch: fetch };
}

export function useProjectDocumentLabels(projectId: string | null) {
  const [labels, setLabels] = useState<ProjectDocumentLabel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    projectDocumentService
      .getLabels(projectId)
      .then(setLabels)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { labels, loading, refetch: fetch };
}

export function useProjectDocument(
  projectId: string | null,
  projectDocumentId: string | null,
) {
  const [document, setDocument] = useState<ProjectDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !projectDocumentId) return;
    setLoading(true);
    setError(null);
    projectDocumentService
      .get(projectId, projectDocumentId)
      .then(setDocument)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, projectDocumentId]);

  return { document, loading, error };
}
