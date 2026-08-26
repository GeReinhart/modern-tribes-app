import { usePolling } from '@/app/platform/core/polling/usePolling.ts';

import { useCallback, useEffect, useState } from 'react';

import { groceriesCatalogService } from './catalogService.ts';
import { groceriesListsService } from './listsService.ts';
import {
  AddedMeal,
  GroceriesItem,
  GroceriesItemCreate,
  GroceriesItemUpdate,
  GroceriesList,
  GroceriesListCreate,
  GroceriesListDetail,
  GroceriesListItemCreate,
  GroceriesListUpdate,
  GroceriesSection,
  GroceriesSectionUpdate,
  GroceriesSuggestion,
  MealSuggestion,
  PersonOption,
} from './types.ts';

const POLL_INTERVAL_MS = 10_000;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Error';
}

export function useGroceriesLists(featureInstanceId: string | null) {
  const [lists, setLists] = useState<GroceriesList[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setLists(await groceriesListsService.listByInstance(featureInstanceId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId]);

  useEffect(() => {
    if (!featureInstanceId) return;
    fetchLists();
    groceriesListsService
      .listPersons(featureInstanceId)
      .then(setPersons)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [featureInstanceId, fetchLists]);

  const createList = useCallback(
    async (data: GroceriesListCreate): Promise<GroceriesList | null> => {
      try {
        const created = await groceriesListsService.create(data);
        setLists((prev) =>
          [...prev, created].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
        );
        return created;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return null;
      }
    },
    [],
  );

  const updateList = useCallback(
    async (listId: string, data: GroceriesListUpdate): Promise<boolean> => {
      try {
        const updated = await groceriesListsService.update(listId, data);
        setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [],
  );

  const toggleFavorite = useCallback(
    (listId: string, isFavorite: boolean) => updateList(listId, { is_favorite: isFavorite }),
    [updateList],
  );

  const setArchived = useCallback(
    (listId: string, archived: boolean) => updateList(listId, { status: archived ? 'archived' : 'active' }),
    [updateList],
  );

  return { lists, persons, error, createList, toggleFavorite, setArchived, refetch: fetchLists };
}

export function useGroceriesListDetail(listId: string | null) {
  const [detail, setDetail] = useState<GroceriesListDetail | null>(null);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [addedMeals, setAddedMeals] = useState<AddedMeal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!listId) return;
    try {
      setDetail(await groceriesListsService.getDetail(listId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId]);

  const fetchMealSuggestions = useCallback(async () => {
    if (!listId) return;
    try {
      setMealSuggestions(await groceriesListsService.listMealSuggestions(listId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId]);

  const fetchAddedMeals = useCallback(async () => {
    if (!listId) return;
    try {
      setAddedMeals(await groceriesListsService.listAddedMeals(listId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId]);

  useEffect(() => {
    fetchMealSuggestions();
    fetchAddedMeals();
  }, [fetchMealSuggestions, fetchAddedMeals]);

  usePolling(fetchDetail, POLL_INTERVAL_MS, !!listId);

  const addMealSuggestion = useCallback(async (mealId: string): Promise<void> => {
    if (!listId) return;
    try {
      await groceriesListsService.addMealToList(listId, mealId);
      await Promise.all([fetchDetail(), fetchMealSuggestions(), fetchAddedMeals()]);
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId, fetchDetail, fetchMealSuggestions, fetchAddedMeals]);

  const removeMealSuggestion = useCallback(async (mealId: string): Promise<void> => {
    if (!listId) return;
    try {
      await groceriesListsService.removeMealFromList(listId, mealId);
      await Promise.all([fetchMealSuggestions(), fetchAddedMeals()]);
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId, fetchMealSuggestions, fetchAddedMeals]);

  const addSuggestedIngredient = useCallback(async (mealId: string, recipeIngredientId: string): Promise<void> => {
    if (!listId) return;
    try {
      await groceriesListsService.addSuggestedIngredient(listId, mealId, recipeIngredientId);
      await fetchDetail();
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId, fetchDetail]);

  const addItem = useCallback(
    async (data: GroceriesListItemCreate): Promise<string | null> => {
      if (!listId) return null;
      try {
        const created = await groceriesListsService.addItem(listId, data);
        await fetchDetail();
        return created.id;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return null;
      }
    },
    [listId, fetchDetail],
  );

  const togglePickedUp = useCallback(async (listItemId: string, pickedUp: boolean): Promise<void> => {
    try {
      await groceriesListsService.updateItem(listItemId, { picked_up: pickedUp });
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) => (i.id === listItemId ? { ...i, picked_up: pickedUp } : i)),
            }
          : prev,
      );
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const updateQuantity = useCallback(async (listItemId: string, quantity: number): Promise<void> => {
    try {
      await groceriesListsService.updateItem(listItemId, { quantity });
      setDetail((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === listItemId ? { ...i, quantity } : i)) } : prev,
      );
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const removeItem = useCallback(async (listItemId: string): Promise<void> => {
    try {
      await groceriesListsService.deleteItem(listItemId);
      setDetail((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== listItemId) } : prev));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const updateComment = useCallback(async (listItemId: string, comment: string): Promise<void> => {
    try {
      await groceriesListsService.updateItem(listItemId, { comment });
      setDetail((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === listItemId ? { ...i, comment } : i)) } : prev,
      );
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, []);

  const renameList = useCallback(async (name: string): Promise<boolean> => {
    if (!listId) return false;
    try {
      const updated = await groceriesListsService.update(listId, { name });
      setDetail((prev) => (prev ? { ...prev, name: updated.name } : prev));
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [listId]);

  return {
    detail, mealSuggestions, addedMeals, error, addItem, addMealSuggestion, removeMealSuggestion,
    addSuggestedIngredient, togglePickedUp, updateQuantity,
    updateComment, renameList, removeItem,
    refetch: fetchDetail,
  };
}

export function useGroceriesCatalog(featureInstanceId: string | null) {
  const [items, setItems] = useState<GroceriesItem[]>([]);
  const [sections, setSections] = useState<GroceriesSection[]>([]);
  const [suggestions, setSuggestions] = useState<GroceriesSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      const [catalogItems, catalogSections, dueItems] = await Promise.all([
        groceriesCatalogService.listItems(featureInstanceId),
        groceriesCatalogService.listSections(featureInstanceId),
        groceriesListsService.listSuggestions(featureInstanceId),
      ]);
      setItems(catalogItems);
      setSections(catalogSections);
      setSuggestions(dueItems);
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [featureInstanceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createItem = useCallback(
    async (data: GroceriesItemCreate): Promise<GroceriesItem | null> => {
      try {
        const created = await groceriesCatalogService.createItem(data);
        setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return null;
      }
    },
    [],
  );

  const createSection = useCallback(
    async (name: string, icon?: string): Promise<GroceriesSection | null> => {
      if (!featureInstanceId) return null;
      try {
        const created = await groceriesCatalogService.createSection({
          feature_instance_id: featureInstanceId, name, icon,
        });
        setSections((prev) => [...prev, created]);
        return created;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return null;
      }
    },
    [featureInstanceId],
  );

  const updateSection = useCallback(
    async (sectionId: string, data: Omit<GroceriesSectionUpdate, 'feature_instance_id'>): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        const updated = await groceriesCatalogService.updateSection(sectionId, {
          feature_instance_id: featureInstanceId, ...data,
        });
        setSections((prev) => prev.map((s) => (s.id === sectionId ? updated : s)));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  const reorderSections = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        setSections(await groceriesCatalogService.reorderSections(orderedIds, featureInstanceId));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  const deleteSection = useCallback(
    async (sectionId: string): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        await groceriesCatalogService.deleteSection(sectionId, featureInstanceId);
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  const linkItemToSection = useCallback(
    async (itemId: string, sectionId: string): Promise<void> => {
      if (!featureInstanceId) return;
      try {
        const sectionIds = await groceriesCatalogService.toggleItemSection(itemId, sectionId, featureInstanceId);
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, section_ids: sectionIds } : i)));
      } catch (e: unknown) {
        setError(errorMessage(e));
      }
    },
    [featureInstanceId],
  );

  const updateItem = useCallback(
    async (itemId: string, data: Omit<GroceriesItemUpdate, 'feature_instance_id'>): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        const updated = await groceriesCatalogService.updateItem(itemId, {
          feature_instance_id: featureInstanceId, ...data,
        });
        setItems((prev) =>
          updated.status !== 'active'
            ? prev.filter((i) => i.id !== itemId)
            : prev.map((i) => (i.id === itemId ? updated : i)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  const setItemRenewal = useCallback(
    async (itemId: string, renewalDurationDays: number | null): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        const updated = await groceriesCatalogService.setItemRenewal(itemId, {
          feature_instance_id: featureInstanceId, renewal_duration_days: renewalDurationDays,
        });
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  const setItemSuggestedQuantity = useCallback(
    async (itemId: string, suggestedQuantity: number | null): Promise<boolean> => {
      if (!featureInstanceId) return false;
      try {
        const updated = await groceriesCatalogService.setItemSuggestedQuantity(itemId, {
          feature_instance_id: featureInstanceId, suggested_quantity: suggestedQuantity,
        });
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
        return true;
      } catch (e: unknown) {
        setError(errorMessage(e));
        return false;
      }
    },
    [featureInstanceId],
  );

  return {
    items, sections, suggestions, error,
    createItem, createSection, updateSection, reorderSections, deleteSection, linkItemToSection, updateItem,
    setItemRenewal, setItemSuggestedQuantity,
    refetch: fetchAll,
  };
}
