import { apiService } from './api.service';
import { PublicationSummary, PublicationDetail, PublicationAdminItem } from '../types/publication.types';
import { LabelInfo } from '../types/project-document.types';

class PublicationService {
    // Public endpoints (no auth required)

    listPublications(q?: string, labelId?: string): Promise<PublicationSummary[]> {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (labelId) params.set('label_id', labelId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return apiService.get<PublicationSummary[]>(`/public/publications/${qs}`);
    }

    getPublication(id: string): Promise<PublicationDetail> {
        return apiService.get<PublicationDetail>(`/public/publications/${id}`);
    }

    listPublicationLabels(): Promise<LabelInfo[]> {
        return apiService.get<LabelInfo[]>('/public/publications/labels');
    }

    // Authenticated endpoints (manager actions on project documents)

    publish(projectId: string, projectDocumentId: string): Promise<{ publication_id: string }> {
        return apiService.patch<{ publication_id: string }>(
            `/project-documents/projects/${projectId}/documents/${projectDocumentId}/publish`
        );
    }

    unpublish(projectId: string, projectDocumentId: string): Promise<void> {
        return apiService.patch<void>(
            `/project-documents/projects/${projectId}/documents/${projectDocumentId}/unpublish`
        );
    }

    // Admin endpoints

    listAdmin(q?: string, tribeId?: string, projectId?: string): Promise<PublicationAdminItem[]> {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (tribeId) params.set('tribe_id', tribeId);
        if (projectId) params.set('project_id', projectId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return apiService.get<PublicationAdminItem[]>(`/publications/${qs}`);
    }

    adminUnpublish(publicationId: string): Promise<void> {
        return apiService.delete<void>(`/publications/${publicationId}`);
    }
}

export const publicationService = new PublicationService();
