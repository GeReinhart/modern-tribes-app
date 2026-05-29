import { apiService } from '@/platform/core/api/api.service.ts';
import { DocumentRevision, RecentChange } from '@/platform/functions/monitoring/monitoring.types.ts';

export const monitoringService = {
  getRecentChanges: (
    hours: number,
    userEmail?: string,
    status?: string,
  ): Promise<RecentChange[]> => {
    const params = new URLSearchParams({ hours: String(hours) });
    if (userEmail) params.set('user_email', userEmail);
    if (status) params.set('status', status);
    return apiService.get<RecentChange[]>(
      `/query/monitoring/recent-changes?${params}`,
    );
  },

  getDocumentRevisions: (documentId: string): Promise<DocumentRevision[]> =>
    apiService.get<DocumentRevision[]>(
      `/query/monitoring/documents/${documentId}/revisions`,
    ),
};
