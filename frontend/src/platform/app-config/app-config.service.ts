import {
  AppConfigCreate,
  AppConfigEntry,
  AppConfigPublic,
  AppConfigUpdate,
} from '@/platform/app-config/app-config.types.ts';
import { apiService } from '@/platform/api/api.service.ts';

class AppConfigService {
  async getPublic(): Promise<AppConfigPublic[]> {
    return apiService.get<AppConfigPublic[]>('/query/app-config/');
  }

  async getAll(): Promise<AppConfigEntry[]> {
    return apiService.get<AppConfigEntry[]>('/crud/app-config/');
  }

  async create(data: AppConfigCreate): Promise<AppConfigEntry> {
    return apiService.post<AppConfigEntry>('/crud/app-config/', data);
  }

  async update(id: string, data: AppConfigUpdate): Promise<AppConfigEntry> {
    return apiService.put<AppConfigEntry>(`/crud/app-config/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`/crud/app-config/${id}`);
  }
}

export const appConfigService = new AppConfigService();
