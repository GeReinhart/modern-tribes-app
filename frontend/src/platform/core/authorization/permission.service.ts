import { apiService } from '@/platform/core/api/api.service.ts';

import {
  Permission,
  PermissionCreate,
  PermissionUpdate,
  PermissionWithUsers,
} from './permission.types.ts';

class PermissionService {
  private endpoint = '/crud/permissions';

  async getAll(): Promise<Permission[]> {
    return apiService.get<Permission[]>(this.endpoint);
  }

  async getById(id: string): Promise<Permission> {
    return apiService.get<Permission>(`${this.endpoint}/${id}`);
  }

  async getPermissionUsers(id: string): Promise<PermissionWithUsers> {
    return apiService.get<PermissionWithUsers>(`${this.endpoint}/${id}/users`);
  }

  async create(data: PermissionCreate): Promise<Permission> {
    return apiService.post<Permission>(this.endpoint, data);
  }

  async update(id: string, data: PermissionUpdate): Promise<Permission> {
    return apiService.put<Permission>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const permissionService = new PermissionService();
