import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GroceriesItem,
  GroceriesItemCreate,
  GroceriesItemRenewalUpdate,
  GroceriesItemUpdate,
  GroceriesSection,
  GroceriesSectionCreate,
  GroceriesSectionUpdate,
} from './types.ts';

class GroceriesCatalogService {
  async listItems(featureInstanceId: string): Promise<GroceriesItem[]> {
    return apiService.get<GroceriesItem[]>(
      `/features/tasks/groceries-items/?feature_instance_id=${featureInstanceId}`,
    );
  }

  async createItem(data: GroceriesItemCreate): Promise<GroceriesItem> {
    return apiService.post<GroceriesItem>('/features/tasks/groceries-items/', data);
  }

  async listSections(featureInstanceId: string): Promise<GroceriesSection[]> {
    return apiService.get<GroceriesSection[]>(
      `/features/tasks/groceries-sections/?feature_instance_id=${featureInstanceId}`,
    );
  }

  async createSection(data: GroceriesSectionCreate): Promise<GroceriesSection> {
    return apiService.post<GroceriesSection>('/features/tasks/groceries-sections/', data);
  }

  async toggleItemSection(itemId: string, sectionId: string, featureInstanceId: string): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/tasks/groceries-items/${itemId}/sections/${sectionId}?feature_instance_id=${featureInstanceId}`,
      {},
    );
  }

  async updateItem(itemId: string, data: GroceriesItemUpdate): Promise<GroceriesItem> {
    return apiService.patch<GroceriesItem>(`/features/tasks/groceries-items/${itemId}`, data);
  }

  async updateSection(sectionId: string, data: GroceriesSectionUpdate): Promise<GroceriesSection> {
    return apiService.patch<GroceriesSection>(`/features/tasks/groceries-sections/${sectionId}`, data);
  }

  async deleteSection(sectionId: string, featureInstanceId: string): Promise<void> {
    return apiService.delete<void>(
      `/features/tasks/groceries-sections/${sectionId}?feature_instance_id=${featureInstanceId}`,
    );
  }

  async setItemRenewal(itemId: string, data: GroceriesItemRenewalUpdate): Promise<GroceriesItem> {
    return apiService.put<GroceriesItem>(`/features/tasks/groceries-items/${itemId}/renewal`, data);
  }
}

export const groceriesCatalogService = new GroceriesCatalogService();
