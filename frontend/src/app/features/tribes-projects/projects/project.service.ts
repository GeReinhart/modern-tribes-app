import {
  ProjectWithDocumentCreate,
  ProjectWithDocumentResponse,
  ProjectWithDocumentUpdate,
} from '@/app/features/tribes-projects/projects/project_with_document.types.ts';
import { Project, ProjectCreate, ProjectUpdate } from '@/app/features/tribes-projects/projects/project.types.ts';
import {
  ArchivedProjectEntry,
  ProjectTribesSummary,
  ProjectTribeWithMembers,
  UserProjectEntry,
} from '@/app/features/tribes-projects/projects/projects.query.types.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

class ProjectService {
  private endpoint = '/features/tribes-projects/projects';

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

  async archive(id: string): Promise<void> {
    return this.delete(id);
  }

  async getByUser(userId: string): Promise<UserProjectEntry[]> {
    return apiService.get<UserProjectEntry[]>(
      `/features/tribes-projects/projects/by/user/${userId}`,
    );
  }

  async getByTribeForUser(
    tribeId: string,
    userId: string,
  ): Promise<UserProjectEntry[]> {
    return apiService.get<UserProjectEntry[]>(
      `/features/tribes-projects/projects/by/tribe/${tribeId}/for/user/${userId}`,
    );
  }

  async createWithDocument(
    data: ProjectWithDocumentCreate,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.post<ProjectWithDocumentResponse>(
      '/features/tribes-projects/projects/with-document',
      data,
    );
  }

  async getWithDocument(
    projectId: string,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.get<ProjectWithDocumentResponse>(
      `/features/tribes-projects/projects/${projectId}/with-document`,
    );
  }

  async updateWithDocument(
    projectId: string,
    data: ProjectWithDocumentUpdate,
  ): Promise<ProjectWithDocumentResponse> {
    return apiService.put<ProjectWithDocumentResponse>(
      `/features/tribes-projects/projects/${projectId}/with-document`,
      data,
    );
  }

  async getTribesWithMembers(
    projectId: string,
  ): Promise<ProjectTribeWithMembers[]> {
    return apiService.get<ProjectTribeWithMembers[]>(
      `/features/tribes-projects/projects/${projectId}/tribes-with-members`,
    );
  }

  async getTribesPerProject(): Promise<ProjectTribesSummary[]> {
    return apiService.get<ProjectTribesSummary[]>(
      `${this.endpoint}/by/all/tribes-summary`,
    );
  }

  async reorderProjectsInTribe(tribeId: string, orderedIds: string[]): Promise<void> {
    return apiService.put<void>(
      `${this.endpoint}/by/tribe/${tribeId}/order`,
      { ordered_ids: orderedIds },
    );
  }

  async getArchivedByTribe(tribeId: string): Promise<ArchivedProjectEntry[]> {
    return apiService.get<ArchivedProjectEntry[]>(
      `${this.endpoint}/by/tribe/${tribeId}/archived`,
    );
  }

  async unarchive(projectId: string): Promise<Project> {
    return apiService.patch<Project>(`${this.endpoint}/${projectId}/unarchive`);
  }
}

export const projectService = new ProjectService();
