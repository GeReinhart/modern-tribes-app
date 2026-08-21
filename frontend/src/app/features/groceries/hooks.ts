import { useCallback, useEffect, useState } from 'react';

import { groceriesCatalogService } from './catalogService.ts';
import { groceriesListsService } from './listsService.ts';
import {
  GroceriesItem,
  GroceriesItemCreate,
  GroceriesItemUpdate,
  GroceriesList,
  GroceriesListCreate,
  GroceriesListDetail,
  GroceriesListItemCreate,
  GroceriesSection,
  GroceriesSectionUpdate,
  GroceriesSuggestion,
  PersonOption,
} from './types.ts';

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

  return { lists, persons, error, createList, refetch: fetchLists };
}

export function useGroceriesListDetail(listId: string | null) {
  const [detail, setDetail] = useState<GroceriesListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!listId) return;
    try {
      setDetail(await groceriesListsService.getDetail(listId));
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  }, [listId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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

  return { detail, error, addItem, togglePickedUp, updateQuantity, updateComment, removeItem, refetch: fetchDetail };
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
        setSections((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
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
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? updated : s)).sort((a, b) => a.name.localeCompare(b.name)),
        );
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

  return {
    items, sections, suggestions, error,
    createItem, createSection, updateSection, deleteSection, linkItemToSection, updateItem, setItemRenewal,
    refetch: fetchAll,
  };
}
