import { useCallback, useEffect, useState } from 'react';

import { findAdjacentIngredientInGroup } from './ingredientOrdering.ts';
import { recipesService } from './service.ts';
import {
  Recipe, RecipeCreate, RecipeDetail, RecipeIngredientCreate, RecipeIngredientUpdate, RecipeLabel, RecipeListFilters,
  RecipeState,
} from './types.ts';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Error';
}

export function useRecipeLabels(featureInstanceId: string | null) {
  const [labels, setLabels] = useState<RecipeLabel[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setLabels(await recipesService.listLabels(featureInstanceId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = useCallback(
    async (name: string, color: string): Promise<RecipeLabel | null> => {
      if (!featureInstanceId) return null;
      try {
        const label = await recipesService.createLabel(featureInstanceId, name, color);
        setLabels((prev) => [...prev, label]);
        return label;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return null;
      }
    },
    [featureInstanceId],
  );

  const updateLabel = useCallback(async (labelId: string, data: { name?: string; color?: string }): Promise<void> => {
    try {
      const updated = await recipesService.updateLabel(labelId, data);
      setLabels((prev) => prev.map((l) => (l.id === labelId ? updated : l)));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const deleteLabel = useCallback(async (labelId: string): Promise<void> => {
    try {
      await recipesService.deleteLabel(labelId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const archiveLabel = useCallback(async (labelId: string): Promise<void> => {
    try {
      await recipesService.updateLabel(labelId, { status: 'archived' });
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const reorderLabels = useCallback(async (orderedIds: string[]): Promise<void> => {
    if (!featureInstanceId) return;
    try {
      setLabels(await recipesService.reorderLabels(featureInstanceId, orderedIds));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId]);

  return {
    labels, error, createLabel, updateLabel, deleteLabel, archiveLabel, reorderLabels, refetch: fetchLabels,
  };
}

export function useRecipes(featureInstanceId: string | null, filters: RecipeListFilters = {}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const labelsHook = useRecipeLabels(featureInstanceId);
  const { q, ingredientId } = filters;

  const fetchRecipes = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setRecipes(await recipesService.listByInstance(featureInstanceId, { q, ingredientId }));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId, q, ingredientId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const createRecipe = useCallback(async (data: RecipeCreate): Promise<Recipe | null> => {
    try {
      const created = await recipesService.create(data);
      setRecipes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return null;
    }
  }, []);

  return {
    recipes,
    labels: labelsHook.labels,
    error: error || labelsHook.error,
    createRecipe,
    createLabel: labelsHook.createLabel,
    updateLabel: labelsHook.updateLabel,
    deleteLabel: labelsHook.deleteLabel,
    archiveLabel: labelsHook.archiveLabel,
    reorderLabels: labelsHook.reorderLabels,
    refetch: fetchRecipes,
  };
}

export function useRecipeDetail(recipeId: string | null) {
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!recipeId) return;
    try {
      setDetail(await recipesService.getDetail(recipeId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [recipeId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const update = useCallback(async (
    data: { name?: string; servings?: number; document_content_html?: string; recipe_state?: RecipeState },
  ) => {
    if (!recipeId) return;
    try {
      await recipesService.update(recipeId, data);
      await fetchDetail();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [recipeId, fetchDetail]);

  const addIngredient = useCallback(async (data: RecipeIngredientCreate): Promise<boolean> => {
    if (!recipeId) return false;
    try {
      await recipesService.addIngredient(recipeId, data);
      await fetchDetail();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [recipeId, fetchDetail]);

  const updateIngredient = useCallback(async (ingredientId: string, data: RecipeIngredientUpdate): Promise<void> => {
    try {
      await recipesService.updateIngredient(ingredientId, data);
      await fetchDetail();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [fetchDetail]);

  const removeIngredient = useCallback(async (ingredientId: string): Promise<void> => {
    try {
      await recipesService.removeIngredient(ingredientId);
      await fetchDetail();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [fetchDetail]);

  const moveIngredient = useCallback(async (ingredientId: string, direction: 'up' | 'down'): Promise<void> => {
    if (!detail) return;
    const swap = findAdjacentIngredientInGroup(detail.ingredients, ingredientId, direction);
    if (!swap) return;
    try {
      await recipesService.updateIngredient(swap.moved.id, { position: swap.neighbor.position });
      await recipesService.updateIngredient(swap.neighbor.id, { position: swap.moved.position });
      await fetchDetail();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [detail, fetchDetail]);

  const toggleLabel = useCallback(async (labelId: string): Promise<void> => {
    if (!recipeId) return;
    try {
      const labelIds = await recipesService.toggleLabel(recipeId, labelId);
      setDetail((prev) => (prev ? { ...prev, label_ids: labelIds } : prev));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [recipeId]);

  return {
    detail, error, update, addIngredient, updateIngredient, removeIngredient, moveIngredient, toggleLabel,
    refetch: fetchDetail,
  };
}
