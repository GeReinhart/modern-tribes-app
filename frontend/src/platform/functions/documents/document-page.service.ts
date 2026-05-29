import {
  DocumentPage,
  DocumentPageCreate,
  DocumentPageReorderItem,
  DocumentPageUpdate,
} from '@/platform/functions/documents/document-page.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class DocumentPageService {
  private base(projectId: string, projectDocumentId: string) {
    return `/project-documents/projects/${projectId}/documents/${projectDocumentId}/pages`;
  }

  list(projectId: string, projectDocumentId: string): Promise<DocumentPage[]> {
    return apiService.get<DocumentPage[]>(
      this.base(projectId, projectDocumentId),
    );
  }

  create(
    projectId: string,
    projectDocumentId: string,
    data: DocumentPageCreate,
  ): Promise<DocumentPage> {
    return apiService.post<DocumentPage>(
      this.base(projectId, projectDocumentId),
      data,
    );
  }

  get(
    projectId: string,
    projectDocumentId: string,
    pageId: string,
  ): Promise<DocumentPage> {
    return apiService.get<DocumentPage>(
      `${this.base(projectId, projectDocumentId)}/${pageId}`,
    );
  }

  update(
    projectId: string,
    projectDocumentId: string,
    pageId: string,
    data: DocumentPageUpdate,
  ): Promise<DocumentPage> {
    return apiService.put<DocumentPage>(
      `${this.base(projectId, projectDocumentId)}/${pageId}`,
      data,
    );
  }

  archive(
    projectId: string,
    projectDocumentId: string,
    pageId: string,
  ): Promise<void> {
    return apiService.patch<void>(
      `${this.base(projectId, projectDocumentId)}/${pageId}/archive`,
    );
  }

  reorder(
    projectId: string,
    projectDocumentId: string,
    items: DocumentPageReorderItem[],
  ): Promise<void> {
    return apiService.patch<void>(
      `${this.base(projectId, projectDocumentId)}/reorder`,
      { items },
    );
  }
}

export const documentPageService = new DocumentPageService();
