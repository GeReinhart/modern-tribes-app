import { UserDisplayInfo } from '@/app/platform/functions/people/users/user-display.types.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

class UserDisplayService {
  async getDisplayInfo(userId: string): Promise<UserDisplayInfo> {
    return apiService.get<UserDisplayInfo>(`/platform/functions/people/users/${userId}/display`);
  }
}

export const userDisplayService = new UserDisplayService();
