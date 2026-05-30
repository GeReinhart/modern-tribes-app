import {
  FeatureTypeInfo,
  ProjectFeatureInstance,
  ProjectFeatureInstanceCreate,
  ProjectFeatureInstanceUpdate,
} from '@/app/features/tribes-projects/projects/project-features.types.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

class ProjectFeaturesService {
  async getFeatureTypes(): Promise<FeatureTypeInfo[]> {
    return apiService.get<FeatureTypeInfo[]>('/features/glue/feature-instances/feature-types');
  }

  async listByProject(
    projectId: string,
    status?: string,
  ): Promise<ProjectFeatureInstance[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiService.get<ProjectFeatureInstance[]>(
      `/features/glue/feature-instances/projects/${projectId}/features${qs}`,
    );
  }

  async create(
    projectId: string,
    data: ProjectFeatureInstanceCreate,
  ): Promise<ProjectFeatureInstance> {
    return apiService.post<ProjectFeatureInstance>(
      `/features/glue/feature-instances/projects/${projectId}/features`,
      data,
    );
  }

  async update(
    projectId: string,
    featureId: string,
    data: ProjectFeatureInstanceUpdate,
  ): Promise<ProjectFeatureInstance> {
    return apiService.patch<ProjectFeatureInstance>(
      `/features/glue/feature-instances/projects/${projectId}/features/${featureId}`,
      data,
    );
  }
}

export const projectFeaturesService = new ProjectFeaturesService();
