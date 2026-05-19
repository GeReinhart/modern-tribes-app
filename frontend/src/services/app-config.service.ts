import { apiService } from './api.service';
import { AppConfigEntry, AppConfigPublic, AppConfigCreate, AppConfigUpdate } from '../types/app-config.types';

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
