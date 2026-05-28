import { UserDisplayInfo } from '@/types/user-display.types';
import { apiService } from './api.service';

class UserDisplayService {
  async getDisplayInfo(userId: string): Promise<UserDisplayInfo> {
    return apiService.get<UserDisplayInfo>(`/query/users/${userId}/display`);
  }
}

export const userDisplayService = new UserDisplayService();
