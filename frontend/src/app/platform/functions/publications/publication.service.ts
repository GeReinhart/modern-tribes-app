import { LabelInfo } from '@/app/platform/functions/labels/label.types.ts';
import {
  PublicationAdminItem,
  PublicationDetail,
  PublicationSummary,
} from '@/app/platform/functions/publications/publication.types.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

class PublicationService {
  // Public endpoints (no auth required)

  listPublications(
    q?: string,
    labelId?: string,
  ): Promise<PublicationSummary[]> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (labelId) params.set('label_id', labelId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiService.get<PublicationSummary[]>(`/platform/functions/publications/public/${qs}`);
  }

  getPublication(id: string): Promise<PublicationDetail> {
    return apiService.get<PublicationDetail>(`/platform/functions/publications/public/${id}`);
  }

  listPublicationLabels(): Promise<LabelInfo[]> {
    return apiService.get<LabelInfo[]>('/platform/functions/publications/public/labels');
  }

  // Authenticated endpoints (manager actions on project documents)

  publish(
    projectId: string,
    projectDocumentId: string,
  ): Promise<{ publication_url_param_id: string }> {
    return apiService.patch<{ publication_url_param_id: string }>(
      `/features/tribes-projects/project-documents/projects/${projectId}/documents/${projectDocumentId}/publish`,
    );
  }

  unpublish(projectId: string, projectDocumentId: string): Promise<void> {
    return apiService.patch<void>(
      `/features/tribes-projects/project-documents/projects/${projectId}/documents/${projectDocumentId}/unpublish`,
    );
  }

  // Admin endpoints

  listAdmin(
    q?: string,
    tribeId?: string,
    projectId?: string,
  ): Promise<PublicationAdminItem[]> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tribeId) params.set('tribe_id', tribeId);
    if (projectId) params.set('project_id', projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiService.get<PublicationAdminItem[]>(`/platform/functions/publications/${qs}`);
  }

  adminUnpublish(publicationId: string): Promise<void> {
    return apiService.delete<void>(`/platform/functions/publications/${publicationId}`);
  }
}

export const publicationService = new PublicationService();
