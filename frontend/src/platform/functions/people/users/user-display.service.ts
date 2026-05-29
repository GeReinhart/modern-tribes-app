import { UserDisplayInfo } from '@/types/user-display.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class UserDisplayService {
  async getDisplayInfo(userId: string): Promise<UserDisplayInfo> {
    return apiService.get<UserDisplayInfo>(`/query/users/${userId}/display`);
  }
}

export const userDisplayService = new UserDisplayService();
