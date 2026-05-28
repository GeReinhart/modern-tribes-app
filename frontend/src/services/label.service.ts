import { Label, LabelCreate, LabelUpdate } from '../types/label.types';
import { apiService } from '../platform/api/api.service.ts';

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

  async searchFeatureLabels(name: string): Promise<
    Array<{
      id: string;
      name: string;
      color: string;
      feature_instance_id: string;
    }>
  > {
    return apiService.get(
      `/query/labels/search?name=${encodeURIComponent(name)}`,
    );
  }
}

export const labelService = new LabelService();
