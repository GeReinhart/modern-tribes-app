import { apiService } from '@/platform/api/api.service.ts';
import {
  AppNotification,
  NotificationCreate,
  NotificationStatus,
  UserSearchResult,
} from '@/types/notification.types';

class NotificationService {
  async searchUsers(q: string): Promise<UserSearchResult[]> {
    return apiService.get<UserSearchResult[]>(
      `/query/users/search?q=${encodeURIComponent(q)}`,
    );
  }

  async createForUser(payload: NotificationCreate): Promise<AppNotification> {
    return apiService.post<AppNotification>('/notifications/admin', payload);
  }

  async listPending(): Promise<AppNotification[]> {
    return apiService.get<AppNotification[]>('/notifications/pending');
  }

  async reportStatus(
    notificationId: string,
    notificationStatus: NotificationStatus.sent | NotificationStatus.failed,
  ): Promise<AppNotification> {
    return apiService.patch<AppNotification>(
      `/notifications/${notificationId}/status`,
      {
        notification_status: notificationStatus,
      },
    );
  }
}

export const notificationService = new NotificationService();
