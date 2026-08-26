import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  AddedMeal,
  GroceriesList,
  GroceriesListCreate,
  GroceriesListDetail,
  GroceriesListItem,
  GroceriesListItemCreate,
  GroceriesListItemUpdate,
  GroceriesListUpdate,
  GroceriesSuggestion,
  MealSuggestion,
  PersonOption,
} from './types.ts';

class GroceriesListsService {
  async listByInstance(featureInstanceId: string): Promise<GroceriesList[]> {
    return apiService.get<GroceriesList[]>(
      `/features/tasks/groceries-lists/by-instance/${featureInstanceId}`,
    );
  }

  async create(data: GroceriesListCreate): Promise<GroceriesList> {
    return apiService.post<GroceriesList>('/features/tasks/groceries-lists/', data);
  }

  async getDetail(listId: string): Promise<GroceriesListDetail> {
    return apiService.get<GroceriesListDetail>(`/features/tasks/groceries-lists/${listId}`);
  }

  async update(listId: string, data: GroceriesListUpdate): Promise<GroceriesList> {
    return apiService.patch<GroceriesList>(`/features/tasks/groceries-lists/${listId}`, data);
  }

  async listSuggestions(featureInstanceId: string): Promise<GroceriesSuggestion[]> {
    return apiService.get<GroceriesSuggestion[]>(
      `/features/tasks/groceries-lists/by-instance/${featureInstanceId}/suggestions`,
    );
  }

  async listPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(
      `/features/tasks/groceries-lists/persons/${featureInstanceId}`,
    );
  }

  // Reads/writes the meals feature's suggestion endpoints by their stable HTTP contract,
  // not by importing the meals feature package, so groceries stays decoupled from it.
  async listMealSuggestions(listId: string): Promise<MealSuggestion[]> {
    return apiService.get<MealSuggestion[]>(`/features/tasks/meals/grocery-suggestions/${listId}`);
  }

  async addMealToList(listId: string, mealId: string): Promise<void> {
    return apiService.post<void>(`/features/tasks/meals/grocery-suggestions/${listId}/add/${mealId}`, {});
  }

  async listAddedMeals(listId: string): Promise<AddedMeal[]> {
    return apiService.get<AddedMeal[]>(`/features/tasks/meals/added-to-groceries-list/${listId}`);
  }

  async addItem(listId: string, data: GroceriesListItemCreate): Promise<GroceriesListItem> {
    return apiService.post<GroceriesListItem>(`/features/tasks/groceries-lists/${listId}/items`, data);
  }

  async updateItem(listItemId: string, data: GroceriesListItemUpdate): Promise<GroceriesListItem> {
    return apiService.patch<GroceriesListItem>(`/features/tasks/groceries-list-items/${listItemId}`, data);
  }

  async deleteItem(listItemId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/groceries-list-items/${listItemId}`);
  }
}

export const groceriesListsService = new GroceriesListsService();
