import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  CatalogItemOption,
  CatalogSectionOption,
  Recipe,
  RecipeCreate,
  RecipeDetail,
  RecipeIngredient,
  RecipeIngredientCreate,
  RecipeIngredientUpdate,
  RecipeLabel,
  RecipeUpdate,
} from './types.ts';

class RecipesService {
  async listByInstance(featureInstanceId: string): Promise<Recipe[]> {
    return apiService.get<Recipe[]>(`/features/tasks/recipes/by-instance/${featureInstanceId}`);
  }

  async getDetail(recipeId: string): Promise<RecipeDetail> {
    return apiService.get<RecipeDetail>(`/features/tasks/recipes/${recipeId}`);
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

  async addIngredient(recipeId: string, data: RecipeIngredientCreate): Promise<RecipeIngredient> {
    return apiService.post<RecipeIngredient>(`/features/tasks/recipes/${recipeId}/ingredients`, data);
  }

  async updateIngredient(ingredientId: string, data: RecipeIngredientUpdate): Promise<RecipeIngredient> {
    return apiService.patch<RecipeIngredient>(`/features/tasks/recipe-ingredients/${ingredientId}`, data);
  }

  async removeIngredient(ingredientId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/recipe-ingredients/${ingredientId}`);
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
}

export const recipesService = new RecipesService();
