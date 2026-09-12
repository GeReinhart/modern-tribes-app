import { apiService } from '@/app/platform/core/api/api.service.ts';
import { DocumentRevision } from '@/app/platform/functions/documents/editor/documentRevisionTypes.ts';

import {
  CatalogItemCreate,
  CatalogItemOption,
  CatalogSectionOption,
  Recipe,
  RecipeComponent,
  RecipeComponentCreate,
  RecipeCreate,
  RecipeDetail,
  RecipeIngredient,
  RecipeIngredientCreate,
  RecipeIngredientUpdate,
  RecipeLabel,
  RecipeListFilters,
  RecipeUpdate,
} from './types.ts';

class RecipesService {
  async listByInstance(featureInstanceId: string, filters: RecipeListFilters = {}): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.ingredientId) params.set('ingredient_id', filters.ingredientId);
    const query = params.toString();
    return apiService.get<Recipe[]>(
      `/features/tasks/recipes/by-instance/${featureInstanceId}${query ? `?${query}` : ''}`,
    );
  }

  async getDetail(recipeId: string): Promise<RecipeDetail> {
    return apiService.get<RecipeDetail>(`/features/tasks/recipes/${recipeId}`);
  }

  // Used to pick an existing recipe as a component of another one — any recipe across the
  // project's recipe books is eligible, not just the current tab's (mirrors how meals picks
  // recipes to link).
  async listByProject(projectId: string): Promise<Recipe[]> {
    return apiService.get<Recipe[]>(`/features/tasks/recipes/by-project/${projectId}`);
  }

  async create(data: RecipeCreate): Promise<Recipe> {
    return apiService.post<Recipe>('/features/tasks/recipes/', data);
  }

  async update(recipeId: string, data: RecipeUpdate): Promise<Recipe> {
    return apiService.patch<Recipe>(`/features/tasks/recipes/${recipeId}`, data);
  }

  async remove(recipeId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/recipes/${recipeId}`);
  }

  async listDocumentRevisions(recipeId: string): Promise<DocumentRevision[]> {
    return apiService.get<DocumentRevision[]>(`/features/tasks/recipes/${recipeId}/document/revisions`);
  }

  async addIngredient(recipeId: string, data: RecipeIngredientCreate): Promise<RecipeIngredient> {
    return apiService.post<RecipeIngredient>(`/features/tasks/recipes/${recipeId}/ingredients`, data);
  }

  async updateIngredient(ingredientId: string, data: RecipeIngredientUpdate): Promise<RecipeIngredient> {
    return apiService.patch<RecipeIngredient>(`/features/tasks/recipe-ingredients/${ingredientId}`, data);
  }

  async removeIngredient(ingredientId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/recipe-ingredients/${ingredientId}`);
  }

  async addComponent(recipeId: string, data: RecipeComponentCreate): Promise<RecipeComponent> {
    return apiService.post<RecipeComponent>(`/features/tasks/recipes/${recipeId}/components`, data);
  }

  async removeComponent(componentId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/recipe-components/${componentId}`);
  }

  async listLabels(featureInstanceId: string): Promise<RecipeLabel[]> {
    return apiService.get<RecipeLabel[]>(`/features/tasks/recipe-labels/by-instance/${featureInstanceId}`);
  }

  async createLabel(featureInstanceId: string, name: string, color: string): Promise<RecipeLabel> {
    return apiService.post<RecipeLabel>('/features/tasks/recipe-labels/', {
      feature_instance_id: featureInstanceId, name, color,
    });
  }

  async updateLabel(labelId: string, data: { name?: string; color?: string; status?: string }): Promise<RecipeLabel> {
    return apiService.patch<RecipeLabel>(`/features/tasks/recipe-labels/${labelId}`, data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/recipe-labels/${labelId}`);
  }

  async reorderLabels(featureInstanceId: string, orderedIds: string[]): Promise<RecipeLabel[]> {
    return apiService.put<RecipeLabel[]>('/features/tasks/recipe-labels/reorder', {
      feature_instance_id: featureInstanceId, ordered_ids: orderedIds,
    });
  }

  async toggleLabel(recipeId: string, labelId: string): Promise<string[]> {
    return apiService.post<string[]>(`/features/tasks/recipes/${recipeId}/labels/${labelId}`, {});
  }

  // Reads the shared groceries catalog by its stable HTTP contract, not by importing the
  // groceries feature package, so recipes stays decoupled from it.
  async listCatalogItems(featureInstanceId: string): Promise<CatalogItemOption[]> {
    return apiService.get<CatalogItemOption[]>(
      `/features/tasks/groceries-items/?feature_instance_id=${featureInstanceId}`,
    );
  }

  async listCatalogSections(featureInstanceId: string): Promise<CatalogSectionOption[]> {
    return apiService.get<CatalogSectionOption[]>(
      `/features/tasks/groceries-sections/?feature_instance_id=${featureInstanceId}`,
    );
  }

  async createCatalogItem(data: CatalogItemCreate): Promise<CatalogItemOption> {
    return apiService.post<CatalogItemOption>('/features/tasks/groceries-items/', data);
  }

  async linkCatalogItemToSection(itemId: string, sectionId: string, featureInstanceId: string): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/tasks/groceries-items/${itemId}/sections/${sectionId}?feature_instance_id=${featureInstanceId}`,
      {},
    );
  }
}

export const recipesService = new RecipesService();
