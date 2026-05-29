import {
  FeatureTypeInfo,
  ProjectFeatureInstance,
  ProjectFeatureInstanceCreate,
  ProjectFeatureInstanceUpdate,
} from '@/types/project-features.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class ProjectFeaturesService {
  async getFeatureTypes(): Promise<FeatureTypeInfo[]> {
    return apiService.get<FeatureTypeInfo[]>('/project-features/feature-types');
  }

  async listByProject(
    projectId: string,
    status?: string,
  ): Promise<ProjectFeatureInstance[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiService.get<ProjectFeatureInstance[]>(
      `/project-features/projects/${projectId}/features${qs}`,
    );
  }

  async create(
    projectId: string,
    data: ProjectFeatureInstanceCreate,
  ): Promise<ProjectFeatureInstance> {
    return apiService.post<ProjectFeatureInstance>(
      `/project-features/projects/${projectId}/features`,
      data,
    );
  }

  async update(
    projectId: string,
    featureId: string,
    data: ProjectFeatureInstanceUpdate,
  ): Promise<ProjectFeatureInstance> {
    return apiService.patch<ProjectFeatureInstance>(
      `/project-features/projects/${projectId}/features/${featureId}`,
      data,
    );
  }
}

export const projectFeaturesService = new ProjectFeaturesService();
