import { apiService } from '@/app/platform/core/api/api.service.ts';

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
}

export const mealsService = new MealsService();
