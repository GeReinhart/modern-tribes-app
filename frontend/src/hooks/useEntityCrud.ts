import { useCallback, useEffect, useRef, useState } from 'react';

import { useApi } from './useApi';

interface EntityService<T, CreateDto, UpdateDto> {
  getAll: () => Promise<T[]>;
  getById: (id: string) => Promise<T>;
  create: (data: CreateDto) => Promise<T>;
  update: (id: string, data: UpdateDto) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export function createEntityHooks<T, CreateDto, UpdateDto>(
  service: EntityService<T, CreateDto, UpdateDto>,
  entityName: string,
) {
  function useList() {
    const [items, setItems] = useState<T[]>([]);
    const { loading, error, execute } = useApi<T[]>();
    const hasFetched = useRef(false);

    const refetch = useCallback(async () => {
      try {
        const data = await execute(() => service.getAll());
        if (data) setItems(data);
      } catch {
        console.error(`Error fetching ${entityName}`);
      }
    }, [execute]);

    useEffect(() => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      refetch();
    }, [refetch]);

    return { items, loading, error, refetch };
  }

  function useById(id: string | null) {
    const { data: item, loading, error, execute } = useApi<T>();
    useEffect(() => {
      if (id) execute(() => service.getById(id));
    }, [id, execute]);
    return { item, loading, error };
  }

  function useMutations() {
    const { loading, error, execute } = useApi<T>();
    const { execute: executeVoid } = useApi<void>();

    const create = useCallback(
      (data: CreateDto) => execute(() => service.create(data)),
      [execute],
    );

    const update = useCallback(
      (id: string, data: UpdateDto) => execute(() => service.update(id, data)),
      [execute],
    );

    const remove = useCallback(
      (id: string) => executeVoid(() => service.delete(id)),
      [executeVoid],
    );

    return { create, update, remove, loading, error };
  }

  return { useList, useById, useMutations };
}
