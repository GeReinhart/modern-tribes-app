import { useCallback, useEffect, useState } from 'react';

import { projectFeaturesService } from '@/services/project-features.service.ts';
import {
  FeatureTypeInfo,
  ProjectFeatureInstance,
  ProjectFeatureInstanceCreate,
} from '@/types/project-features.types.ts';

export function useProjectFeatures(projectId: string | null) {
  const [features, setFeatures] = useState<ProjectFeatureInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    projectFeaturesService
      .listByProject(projectId, 'active')
      .then((data) => setFeatures(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createFeature = useCallback(
    async (
      data: ProjectFeatureInstanceCreate,
    ): Promise<ProjectFeatureInstance | null> => {
      if (!projectId) return null;
      try {
        const created = await projectFeaturesService.create(projectId, data);
        setFeatures((prev) => [...prev, created]);
        return created;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
        return null;
      }
    },
    [projectId],
  );

  const renameFeature = useCallback(
    async (featureId: string, name: string): Promise<void> => {
      if (!projectId) return;
      try {
        const updated = await projectFeaturesService.update(
          projectId,
          featureId,
          { name },
        );
        setFeatures((prev) =>
          prev.map((f) =>
            f.id === featureId ? { ...f, name: updated.name } : f,
          ),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [projectId],
  );

  const archiveFeature = useCallback(
    async (featureId: string): Promise<void> => {
      if (!projectId) return;
      try {
        await projectFeaturesService.update(projectId, featureId, {
          status: 'archived',
        });
        setFeatures((prev) => prev.filter((f) => f.id !== featureId));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [projectId],
  );

  return {
    features,
    loading,
    error,
    refetch: fetch,
    createFeature,
    renameFeature,
    archiveFeature,
  };
}

export function useFeatureTypes() {
  const [featureTypes, setFeatureTypes] = useState<FeatureTypeInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    projectFeaturesService
      .getFeatureTypes()
      .then(setFeatureTypes)
      .finally(() => setLoading(false));
  }, []);

  return { featureTypes, loading };
}
