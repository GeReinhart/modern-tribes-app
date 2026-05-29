import {
  ProjectDocument,
  ProjectDocumentCreate,
  ProjectDocumentLabel,
  ProjectDocumentSummary,
  ProjectDocumentUpdate,
} from '@/types/project-document.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class ProjectDocumentService {
  private base(projectId: string) {
    return `/project-documents/projects/${projectId}`;
  }

  list(
    projectId: string,
    q?: string,
    labelId?: string,
  ): Promise<ProjectDocumentSummary[]> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (labelId) params.set('label_id', labelId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiService.get<ProjectDocumentSummary[]>(
      `${this.base(projectId)}/documents${qs}`,
    );
  }

  create(
    projectId: string,
    data: ProjectDocumentCreate,
  ): Promise<ProjectDocument> {
    return apiService.post<ProjectDocument>(
      `${this.base(projectId)}/documents`,
      data,
    );
  }

  get(projectId: string, projectDocumentId: string): Promise<ProjectDocument> {
    return apiService.get<ProjectDocument>(
      `${this.base(projectId)}/documents/${projectDocumentId}`,
    );
  }

  update(
    projectId: string,
    projectDocumentId: string,
    data: ProjectDocumentUpdate,
  ): Promise<ProjectDocument> {
    return apiService.put<ProjectDocument>(
      `${this.base(projectId)}/documents/${projectDocumentId}`,
      data,
    );
  }

  archive(projectId: string, projectDocumentId: string): Promise<void> {
    return apiService.patch<void>(
      `${this.base(projectId)}/documents/${projectDocumentId}/archive`,
    );
  }

  getLabels(projectId: string): Promise<ProjectDocumentLabel[]> {
    return apiService.get<ProjectDocumentLabel[]>(
      `${this.base(projectId)}/document-labels`,
    );
  }
}

export const projectDocumentService = new ProjectDocumentService();
