import { publicationService } from '@/services/publication.service';
import { LabelInfo } from '@/types/project-document.types';
import { PublicationSummary } from '@/types/publication.types';

import { useEffect, useState } from 'react';

export function usePublicationLabels() {
  const [labels, setLabels] = useState<LabelInfo[]>([]);

  useEffect(() => {
    publicationService
      .listPublicationLabels()
      .then(setLabels)
      .catch(() => setLabels([]));
  }, []);

  return { labels };
}

export function usePublications(q?: string, labelId?: string) {
  const [publications, setPublications] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    publicationService
      .listPublications(q, labelId)
      .then(setPublications)
      .catch(() => setError('error'))
      .finally(() => setLoading(false));
  }, [q, labelId]);

  return { publications, loading, error };
}
