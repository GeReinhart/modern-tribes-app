import { apiService } from '@/app/platform/core/api/api.service.ts';
import { DocumentRevision } from '@/app/platform/functions/documents/editor/documentRevisionTypes.ts';

import { GrocerySuggestion, Meal, MealCreate, MealUpdate, PersonOption, RecipeOption } from './types.ts';

class MealsService {
  async listByInstance(featureInstanceId: string): Promise<Meal[]> {
    return apiService.get<Meal[]>(`/features/tasks/meals/by-instance/${featureInstanceId}`);
  }

  async create(data: MealCreate): Promise<Meal> {
    return apiService.post<Meal>('/features/tasks/meals/', data);
  }

  async update(mealId: string, data: MealUpdate): Promise<Meal> {
    return apiService.patch<Meal>(`/features/tasks/meals/${mealId}`, data);
  }

  async remove(mealId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/meals/${mealId}`);
  }

  async listDocumentRevisions(mealId: string): Promise<DocumentRevision[]> {
    return apiService.get<DocumentRevision[]>(`/features/tasks/meals/${mealId}/document/revisions`);
  }

  async setParticipants(mealId: string, personIds: string[]): Promise<string[]> {
    return apiService.post<string[]>(`/features/tasks/meals/${mealId}/participants`, personIds);
  }

  async toggleRecipe(mealId: string, recipeId: string): Promise<string[]> {
    return apiService.post<string[]>(`/features/tasks/meals/${mealId}/recipes/${recipeId}`, {});
  }

  async listPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(`/features/tasks/meals/persons/${featureInstanceId}`);
  }

  // Reads the recipes feature's project-wide listing by its stable HTTP contract, not by
  // importing the recipes feature package, so meals stays decoupled from it.
  async listProjectRecipes(projectId: string): Promise<RecipeOption[]> {
    return apiService.get<RecipeOption[]>(`/features/tasks/recipes/by-project/${projectId}`);
  }

  async getGrocerySuggestions(groceriesListId: string): Promise<GrocerySuggestion[]> {
    return apiService.get<GrocerySuggestion[]>(`/features/tasks/meals/grocery-suggestions/${groceriesListId}`);
  }

  async downloadPdf(featureInstanceId: string, startDate: string, endDate: string): Promise<Blob> {
    return apiService.getBlob(
      `/features/tasks/meals/pdf/${featureInstanceId}?start_date=${startDate}&end_date=${endDate}`,
    );
  }
}

export const mealsService = new MealsService();

export const triggerMealsPdfDownload = async (
  featureInstanceId: string, startDate: string, endDate: string,
): Promise<void> => {
  const blob = await mealsService.downloadPdf(featureInstanceId, startDate, endDate);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meals-${startDate}-to-${endDate}.pdf`;
  link.click();
  // Also open it for viewing, same as saving a regular file then opening it — delay the
  // revoke so the just-opened tab has time to actually load the blob before it's freed.
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
