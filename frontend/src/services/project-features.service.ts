import { apiService } from './api.service';
import {
    ProjectFeatureInstance,
    ProjectFeatureInstanceCreate,
    ProjectFeatureInstanceUpdate,
    FeatureTypeInfo,
} from '../types/project-features.types';

class ProjectFeaturesService {
    async getFeatureTypes(): Promise<FeatureTypeInfo[]> {
        return apiService.get<FeatureTypeInfo[]>('/project-features/feature-types');
    }

    async listByProject(projectId: string): Promise<ProjectFeatureInstance[]> {
        return apiService.get<ProjectFeatureInstance[]>(`/project-features/projects/${projectId}/features`);
    }

    async create(projectId: string, data: ProjectFeatureInstanceCreate): Promise<ProjectFeatureInstance> {
        return apiService.post<ProjectFeatureInstance>(`/project-features/projects/${projectId}/features`, data);
    }

    async update(projectId: string, featureId: string, data: ProjectFeatureInstanceUpdate): Promise<ProjectFeatureInstance> {
        return apiService.patch<ProjectFeatureInstance>(`/project-features/projects/${projectId}/features/${featureId}`, data);
    }
}

export const projectFeaturesService = new ProjectFeaturesService();
