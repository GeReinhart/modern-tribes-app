import { publicationService } from '@/app/platform/functions/publications/publication.service.ts';
import { LabelInfo } from '@/app/platform/functions/labels/label.types.ts';
import { PublicationSummary } from '@/app/platform/functions/publications/publication.types.ts';

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
