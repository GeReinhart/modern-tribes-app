import { useEffect, useState } from 'react';

import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';
import { useAccessibleProjectsWithTribes } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { projectFeaturesService } from '@/app/features/tribes-projects/projects/project-features.service.ts';
import type { ProjectFeatureInstance } from '@/app/features/tribes-projects/projects/project-features.types.ts';

export interface FeatureInstanceOption {
  instance: ProjectFeatureInstance;
  project_name: string;
  tribe_name: string;
}

export function useAllFeatureInstances() {
  const { user } = useCurrentUserProfile();
  const { projects } = useAccessibleProjectsWithTribes(user?.id ?? '');
  const [options, setOptions] = useState<FeatureInstanceOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projects.length) {
      setOptions([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    Promise.all(
      projects.map(async (p) => {
        const features = await projectFeaturesService.listByProject(p.project_id, 'active');
        return features.map((f): FeatureInstanceOption => ({
          instance: f,
          project_name: p.project_name,
          tribe_name: p.tribe_name,
        }));
      }),
    )
      .then((groups) => { if (!cancelled) setOptions(groups.flat()); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projects]);

  return { options, loading };
}

export function useInstanceOptions(projectId: string, featureTypes: string[]) {
  const [instances, setInstances] = useState<ProjectFeatureInstance[]>([]);

  useEffect(() => {
    if (!projectId) {
      setInstances([]);
      return;
    }
    let cancelled = false;
    projectFeaturesService.listByProject(projectId, 'active').then((all) => {
      if (!cancelled) setInstances(all.filter((f) => featureTypes.includes(f.feature_type)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, featureTypes.join(',')]);

  return instances;
}
