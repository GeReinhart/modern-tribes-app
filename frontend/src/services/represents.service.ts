import { apiService } from './api.service';
import { Represents, RepresentsCreate, RepresentsUpdate } from '../types/represents.types';

class RepresentsService {
    private endpoint = '/crud/represents';

    async getAll(): Promise<Represents[]> {
        return apiService.get<Represents[]>(this.endpoint);
    }

    async getById(id: string): Promise<Represents> {
        return apiService.get<Represents>(`${this.endpoint}/${id}`);
    }

    async getByUserId(userId: string): Promise<Represents[]> {
        return apiService.get<Represents[]>(`${this.endpoint}/by/user/${userId}`);
    }

    async create(data: RepresentsCreate): Promise<Represents> {
        return apiService.post<Represents>(this.endpoint, data);
    }

    async update(id: string, data: RepresentsUpdate): Promise<Represents> {
        return apiService.put<Represents>(`${this.endpoint}/${id}`, data);
    }

    async delete(id: string): Promise<void> {
        return apiService.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const representsService = new RepresentsService();
