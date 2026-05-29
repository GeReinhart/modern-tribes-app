import {
  ProjectWithDocumentCreate,
  ProjectWithDocumentResponse,
  ProjectWithDocumentUpdate,
} from '@/features/tribes-projects/projects/project_with_document.types.ts';
import { Project, ProjectCreate, ProjectUpdate } from '@/features/tribes-projects/projects/project.types.ts';
import {
  ProjectTribeWithMembers,
  UserProjectEntry,
} from '@/features/tribes-projects/projects/projects.query.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class ProjectService {
  private endpoint = '/crud/projects';

  async getAll(): Promise<Project[]> {
    return apiService.get<Project[]>(this.endpoint);
  }

  async getById(id: string): Promise<Project> {
    return apiService.get<Project>(`${this.endpoint}/${id}`);
  }

  async create(data: ProjectCreate): Promise<Project> {
    return apiService.post<Project>(this.endpoint, data);
  }

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    return apiService.put<Project>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  async getByUser(userId: string): Promise<UserProjectEntry[]> {
    return apiService.get<UserProjectEntry[]>(
      `/query/projects/by/user/${userId}`,
    );
  }

  async getByTribeForUser(
    tribeId: string,
    userId: string,
  ): Promise<UserProjectEntry[]> {
    return apiService.get<UserProjectEntry[]>(
      `/query/projects/by/tribe/${tribeId}/for/user/${userId}`,
    );
  }

  async createWithDocument(
    data: ProjectWithDocumentCreate,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.post<ProjectWithDocumentResponse>(
      '/projects/with-document',
      data,
    );
  }

  async getWithDocument(
    projectId: string,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.get<ProjectWithDocumentResponse>(
      `/projects/${projectId}/with-document`,
    );
  }

  async updateWithDocument(
    projectId: string,
    data: ProjectWithDocumentUpdate,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.put<ProjectWithDocumentResponse>(
      `/projects/${projectId}/with-document`,
      data,
    );
  }

  async getTribesWithMembers(
    projectId: string,
  ): Promise<ProjectTribeWithMembers[]> {
    return apiService.get<ProjectTribeWithMembers[]>(
      `/projects/${projectId}/tribes-with-members`,
    );
  }
}

export const projectService = new ProjectService();
