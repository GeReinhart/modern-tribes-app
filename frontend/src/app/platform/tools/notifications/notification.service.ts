import { apiService } from '@/app/platform/core/api/api.service.ts';
import {
  AppNotification,
  NotificationCreate,
  NotificationStatus,
  UserSearchResult,
} from '@/app/platform/tools/notifications/notification.types.ts';

class NotificationService {
  async searchUsers(q: string): Promise<UserSearchResult[]> {
    return apiService.get<UserSearchResult[]>(
      `/platform/functions/people/users/search?q=${encodeURIComponent(q)}`,
    );
  }

  async createForUser(payload: NotificationCreate): Promise<AppNotification> {
    return apiService.post<AppNotification>('/platform/tools/notifications/admin', payload);
  }

  async listPending(): Promise<AppNotification[]> {
    return apiService.get<AppNotification[]>('/platform/tools/notifications/pending');
  }

  async reportStatus(
    notificationId: string,
    notificationStatus: NotificationStatus.sent | NotificationStatus.failed,
  ): Promise<AppNotification> {
    return apiService.patch<AppNotification>(
      `/platform/tools/notifications/${notificationId}/status`,
      {
        notification_status: notificationStatus,
      },
    );
  }
}

export const notificationService = new NotificationService();
