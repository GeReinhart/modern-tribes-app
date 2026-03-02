import { apiService } from './api.service';
import { Label, LabelCreate, LabelUpdate } from '../types/label.types';

class LabelService {
    private endpoint = '/crud/labels';

    async getAll(): Promise<Label[]> {
        return apiService.get<Label[]>(this.endpoint);
    }

    async getById(id: string): Promise<Label> {
        return apiService.get<Label>(`${this.endpoint}/${id}`);
    }


    async create(data: LabelCreate): Promise<Label> {
        return apiService.post<Label>(this.endpoint, data);
    }

    async update(id: string, data: LabelUpdate): Promise<Label> {
        return apiService.put<Label>(`${this.endpoint}/${id}`, data);
    }

    async delete(id: string): Promise<void> {
        return apiService.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const labelService = new LabelService()