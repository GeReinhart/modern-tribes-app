import { apiService } from '@/app/platform/core/api/api.service.ts';
import { DocumentRevision, RecentChange } from '@/app/platform/functions/monitoring/monitoring.types.ts';

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
      `/platform/functions/monitoring/recent-changes?${params}`,
    );
  },

  getDocumentRevisions: (documentId: string): Promise<DocumentRevision[]> =>
    apiService.get<DocumentRevision[]>(
      `/platform/functions/monitoring/documents/${documentId}/revisions`,
    ),
};
