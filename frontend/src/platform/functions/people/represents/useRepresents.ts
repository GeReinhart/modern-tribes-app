import { apiHooks } from '@/platform/core/api/api-hooks.ts';
import { createEntityHooks } from '@/hooks/useEntityCrud.ts';
import { representsService } from '@/services/represents.service.ts';
import {
  Represents,
  RepresentsCreate,
  RepresentsUpdate,
} from '@/types/represents.types.ts';

import { useCallback, useEffect } from 'react';

const { useList, useById, useMutations } = createEntityHooks<
  Represents,
  RepresentsCreate,
  RepresentsUpdate
>(representsService, 'represents');

export function useRepresents() {
  const { items: represents, ...rest } = useList();
  return { represents, ...rest };
}

export function useRepresentsById(id: string | null) {
  const { item: represents, ...rest } = useById(id);
  return { represents, ...rest };
}

export function useRepresentsMutations() {
  const {
    create: createRepresents,
    update: updateRepresents,
    remove: deleteRepresents,
    loading,
    error,
  } = useMutations();
  return {
    createRepresents,
    updateRepresents,
    deleteRepresents,
    loading,
    error,
  };
}

export function useRepresentsByUserId(userId: string | null) {
  const { data, loading, error, execute } = apiHooks<Represents[]>();

  const fetch = useCallback(async () => {
    if (!userId) return;
    await execute(() => representsService.getByUserId(userId));
  }, [userId, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { represents: data ?? [], loading, error };
}
