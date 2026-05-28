import { apiService } from '@/platform/api/api.service.ts';

import {
  Role,
  RoleCreate,
  RoleUpdate,
  RoleWithPermissions,
} from './role.types';

class RoleService {
  private endpoint = '/crud/roles';

  async getAll(): Promise<Role[]> {
    return apiService.get<Role[]>(this.endpoint);
  }

  async getAllWithPermissions(): Promise<RoleWithPermissions[]> {
    return apiService.get<RoleWithPermissions[]>(
      `${this.endpoint}/with/permissions`,
    );
  }

  async getById(id: string): Promise<Role> {
    return apiService.get<Role>(`${this.endpoint}/${id}`);
  }

  async create(data: RoleCreate): Promise<Role> {
    return apiService.post<Role>(this.endpoint, data);
  }

  async update(id: string, data: RoleUpdate): Promise<Role> {
    return apiService.put<Role>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const roleService = new RoleService();
