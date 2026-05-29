import { apiHooks } from '@/platform/core/api/api-hooks.ts';
import { tribeWithPositionService } from '@/features/tribes-projects/tribes/tribe_with_positions.service.ts';
import { tribeService } from '@/features/tribes-projects/tribes/tribe.service.ts';
import {
  TribeWithPositionsCreate,
  TribeWithPositionsResponse,
  TribeWithPositionsUpdate,
} from '@/types/app/tribe_with_positions.types.ts';
import { Tribe, TribeCreate, TribeUpdate } from '@/types/tribe.types.ts';

import { useCallback, useEffect, useState } from 'react';

export function useTribeMutations() {
  const { loading, error, execute } = apiHooks<Tribe>();

  const getTribeById = useCallback(
    async (id: string) => {
      return execute(() => tribeService.getById(id));
    },
    [execute],
  );

  const createTribe = useCallback(
    async (data: TribeCreate) => {
      return execute(() => tribeService.create(data));
    },
    [execute],
  );

  const updateTribe = useCallback(
    async (id: string, data: TribeUpdate) => {
      return execute(() => tribeService.update(id, data));
    },
    [execute],
  );

  const deleteTribe = useCallback(
    async (id: string) => {
      return execute(() => tribeService.delete(id) as unknown as Promise<Tribe>);
    },
    [execute],
  );

  return {
    getTribeById,
    createTribe,
    updateTribe,
    deleteTribe,
    loading,
    error,
  };
}

export function useTribeWithPositions(tribeId: string | null) {
  const [tribe, setTribe] = useState<TribeWithPositionsResponse | null>(null);
  const { loading, error, execute } = apiHooks<TribeWithPositionsResponse>();

  const fetchTribe = useCallback(async () => {
    if (!tribeId) return;

    try {
      const data = await execute(() =>
        tribeWithPositionService.getWithPositions(tribeId),
      );
      if (data) setTribe(data);
    } catch (error) {
      console.error('Error fetching tribe with positions:', error);
    }
  }, [tribeId, execute]);

  useEffect(() => {
    fetchTribe();
  }, [fetchTribe]);

  return {
    tribe,
    loading,
    error,
    refetch: fetchTribe,
  };
}

export function useTribeWithPositionsMutations() {
  const { loading, error, execute } = apiHooks<TribeWithPositionsResponse>();

  const createTribeWithPositions = useCallback(
    async (data: TribeWithPositionsCreate) => {
      return execute(() => tribeWithPositionService.createWithPositions(data));
    },
    [execute],
  );

  const updateTribeWithPositions = useCallback(
    async (id: string, data: TribeWithPositionsUpdate) => {
      return execute(() =>
        tribeWithPositionService.updateWithPositions(id, data),
      );
    },
    [execute],
  );

  return {
    createTribeWithPositions,
    updateTribeWithPositions,
    loading,
    error,
  };
}
