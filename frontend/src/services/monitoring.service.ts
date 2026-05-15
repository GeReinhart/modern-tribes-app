import { apiService } from '@/services/api.service.ts';
import { RecentChange } from '@/types/monitoring.types.ts';

export const monitoringService = {
    getRecentChanges: (hours: number, userEmail?: string): Promise<RecentChange[]> => {
        const params = new URLSearchParams({ hours: String(hours) });
        if (userEmail) params.set('user_email', userEmail);
        return apiService.get<RecentChange[]>(`/query/monitoring/recent-changes?${params}`);
    },
};
