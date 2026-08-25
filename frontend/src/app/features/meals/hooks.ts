import { useCallback, useEffect, useState } from 'react';

import { mealsService } from './service.ts';
import { Meal, MealCreate, MealUpdate, PersonOption, RecipeOption } from './types.ts';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Error';
}

export function useMeals(featureInstanceId: string | null, projectId: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setMeals(await mealsService.listByInstance(featureInstanceId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId]);

  useEffect(() => {
    if (!featureInstanceId) return;
    fetchMeals();
    mealsService.listPersons(featureInstanceId).then(setPersons).catch((e: unknown) => setError(errorMessage(e)));
  }, [featureInstanceId, fetchMeals]);

  useEffect(() => {
    if (!projectId) return;
    mealsService.listProjectRecipes(projectId).then(setRecipes).catch((e: unknown) => setError(errorMessage(e)));
  }, [projectId]);

  const createMeal = useCallback(async (data: MealCreate): Promise<Meal | null> => {
    try {
      const created = await mealsService.create(data);
      setMeals((prev) => [...prev, created].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      return created;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return null;
    }
  }, []);

  const updateMeal = useCallback(async (mealId: string, data: MealUpdate): Promise<boolean> => {
    try {
      const updated = await mealsService.update(mealId, data);
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? updated : m)).sort((a, b) => a.start_at.localeCompare(b.start_at)),
      );
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, []);

  const removeMeal = useCallback(async (mealId: string): Promise<void> => {
    try {
      await mealsService.remove(mealId);
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const setParticipants = useCallback(async (mealId: string, personIds: string[]): Promise<void> => {
    try {
      await mealsService.setParticipants(mealId, personIds);
      await fetchMeals();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [fetchMeals]);

  const toggleRecipe = useCallback(async (mealId: string, recipeId: string): Promise<void> => {
    try {
      const recipeIds = await mealsService.toggleRecipe(mealId, recipeId);
      setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, recipe_ids: recipeIds } : m)));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  return {
    meals, persons, recipes, error,
    createMeal, updateMeal, removeMeal, setParticipants, toggleRecipe,
    refetch: fetchMeals,
  };
}
