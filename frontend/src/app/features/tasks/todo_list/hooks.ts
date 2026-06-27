import { useCallback, useEffect, useRef, useState } from 'react';

import { todoListService } from './service.ts';
import {
  PersonOption,
  TaskReminderCreate,
  TodoItem,
  TodoItemCreate,
  TodoItemUpdate,
  TodoLabel,
  TodoLabelCreate,
  TodoLabelUpdate,
} from './types.ts';

const POLL_INTERVAL_MS = 10_000;

export function useTodoList(featureInstanceId: string | null) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [labels, setLabels] = useState<TodoLabel[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchItems = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setItems(await todoListService.listByInstance(featureInstanceId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [featureInstanceId]);

  const fetchStatic = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      const [lbls, prsns] = await Promise.all([
        todoListService.listLabels(featureInstanceId),
        todoListService.listPersons(featureInstanceId),
      ]);
      setLabels(lbls);
      setPersons(prsns);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [featureInstanceId]);

  useEffect(() => {
    if (!featureInstanceId) return;
    fetchItems();
    fetchStatic();
    intervalRef.current = setInterval(fetchItems, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [featureInstanceId, fetchItems, fetchStatic]);

  const createItem = useCallback(
    async (data: TodoItemCreate): Promise<TodoItem | null> => {
      try {
        const created = await todoListService.create(data);
        setItems((prev) => [...prev, created]);
        return created;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return null;
      }
    },
    [],
  );

  const updateItem = useCallback(
    async (itemId: string, data: TodoItemUpdate): Promise<void> => {
      try {
        const updated = await todoListService.update(itemId, data);
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      await todoListService.delete(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  const createLabel = useCallback(
    async (data: TodoLabelCreate): Promise<TodoLabel | null> => {
      try {
        const label = await todoListService.createLabel(data);
        setLabels((prev) => [...prev, label]);
        return label;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return null;
      }
    },
    [],
  );

  const updateLabel = useCallback(
    async (labelId: string, data: TodoLabelUpdate): Promise<void> => {
      try {
        await todoListService.updateLabel(labelId, data);
        setLabels((prev) =>
          prev.map((l) => (l.id === labelId ? { ...l, ...data } : l)),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const deleteLabel = useCallback(async (labelId: string): Promise<void> => {
    try {
      await todoListService.deleteLabel(labelId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      setItems((prev) =>
        prev.map((i) => ({
          ...i,
          label_ids: i.label_ids.filter((id) => id !== labelId),
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  const toggleLabel = useCallback(
    async (itemId: string, labelId: string): Promise<void> => {
      try {
        const newLabelIds = await todoListService.toggleLabel(itemId, labelId);
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, label_ids: newLabelIds } : i,
          ),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const setReminders = useCallback(
    async (itemId: string, reminders: TaskReminderCreate[]): Promise<void> => {
      try {
        const updated = await todoListService.setReminders(itemId, reminders);
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, reminders: updated } : i)),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  return {
    items,
    labels,
    persons,
    error,
    createItem,
    updateItem,
    deleteItem,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleLabel,
    setReminders,
    refetch: fetchItems,
  };
}
