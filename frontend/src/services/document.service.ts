import {
  Document,
  DocumentCreate,
  DocumentUpdate,
} from '../types/document.types';
import { apiService } from './api.service';

class DocumentService {
  private endpoint = '/crud/documents';

  async getAll(): Promise<Document[]> {
    return apiService.get<Document[]>(this.endpoint);
  }

  async getById(id: string): Promise<Document> {
    return apiService.get<Document>(`${this.endpoint}/${id}`);
  }

  async create(data: DocumentCreate): Promise<Document> {
    return apiService.post<Document>(this.endpoint, data);
  }

  async update(id: string, data: DocumentUpdate): Promise<Document> {
    return apiService.put<Document>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const documentService = new DocumentService();
