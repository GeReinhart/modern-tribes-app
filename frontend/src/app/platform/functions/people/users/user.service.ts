import {
  User,
  UserCreate,
  UserUpdate,
  UserWithRolesAndPermissions,
} from '@/app/platform/functions/people/users/user.types.ts';
import { apiService } from '@/app/platform/core/api/api.service.ts';

class UserService {
  private endpoint = '/platform/functions/people/users';

  async getAll(): Promise<User[]> {
    return apiService.get<User[]>(this.endpoint);
  }

  async getById(id: string): Promise<User> {
    return apiService.get<User>(`${this.endpoint}/${id}`);
  }

  async getAllWithRolesAndPermissions(): Promise<
    UserWithRolesAndPermissions[]
  > {
    return apiService.get<UserWithRolesAndPermissions[]>(
      `${this.endpoint}/with/roles/permissions`,
    );
  }

  async getByIdWithRolesAndPermissions(
    id: string,
  ): Promise<UserWithRolesAndPermissions> {
    return apiService.get<UserWithRolesAndPermissions>(
      `${this.endpoint}/${id}/with/roles/permissions`,
    );
  }

  async create(data: UserCreate): Promise<User> {
    return apiService.post<User>(this.endpoint, data);
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    return apiService.put<User>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  async sendMagicLink(
    userId: string,
  ): Promise<{ message: string; email: string }> {
    return apiService.post<{ message: string; email: string }>(
      `${this.endpoint}/${userId}/magic-link/send`,
      {},
    );
  }

  async generateMagicLink(
    userId: string,
  ): Promise<{ magic_link: string; email: string }> {
    return apiService.get<{ magic_link: string; email: string }>(
      `${this.endpoint}/${userId}/magic-link/generate`,
    );
  }
}

export const userService = new UserService();
