import { useState, useEffect, useCallback, useRef } from 'react';
import { todoListService } from './service';
import { TodoItem, TodoItemCreate, TodoItemUpdate } from './types';

const POLL_INTERVAL_MS = 10_000;

export function useTodoItems(featureInstanceId: string | null) {
    const [items, setItems] = useState<TodoItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetch = useCallback(async () => {
        if (!featureInstanceId) return;
        try {
            const data = await todoListService.listByInstance(featureInstanceId);
            setItems(data);
        } catch (e: any) {
            setError(e.message);
        }
    }, [featureInstanceId]);

    useEffect(() => {
        if (!featureInstanceId) return;
        fetch();
        intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [featureInstanceId, fetch]);

    const createItem = useCallback(async (data: TodoItemCreate): Promise<TodoItem | null> => {
        try {
            const created = await todoListService.create(data);
            setItems(prev => [...prev, created]);
            return created;
        } catch (e: any) {
            setError(e.message);
            return null;
        }
    }, []);

    const updateItem = useCallback(async (itemId: string, data: TodoItemUpdate): Promise<void> => {
        try {
            const updated = await todoListService.update(itemId, data);
            setItems(prev => prev.map(i => i.id === itemId ? updated : i));
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    const deleteItem = useCallback(async (itemId: string): Promise<void> => {
        try {
            await todoListService.delete(itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    return { items, error, createItem, updateItem, deleteItem, refetch: fetch };
}
