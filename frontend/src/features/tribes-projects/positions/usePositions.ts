import { apiHooks } from '@/platform/core/api/api-hooks.ts';
import { createEntityHooks } from '@/platform/core/api/useEntityCrud.ts';
import { positionService } from '@/features/tribes-projects/positions/position.service.ts';
import {
  Position,
  PositionCreate,
  PositionUpdate,
} from '@/types/position.types.ts';

import { useCallback, useEffect, useState } from 'react';

const { useList, useById, useMutations } = createEntityHooks<
  Position,
  PositionCreate,
  PositionUpdate
>(positionService, 'positions');

export function usePositions() {
  const { items: positions, ...rest } = useList();
  return { positions, ...rest };
}

export function usePosition(id: string | null) {
  const { item: position, ...rest } = useById(id);
  return { position, ...rest };
}

export function usePositionsByTribe(tribe_id: string | null) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [hasFetched, setHasFetched] = useState(!tribe_id);
  const { loading, error, execute } = apiHooks<Position[]>();

  const fetch = useCallback(async () => {
    if (!tribe_id) {
      setHasFetched(true);
      return;
    }
    try {
      const data = await execute(() =>
        positionService.getAllByTribeId(tribe_id),
      );
      if (data) setPositions(data);
    } catch {
      console.error('Error fetching positions by tribe');
    }
    setHasFetched(true);
  }, [tribe_id, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { positions, loading, hasFetched, error, refetch: fetch };
}

export function usePositionMutations() {
  const {
    create: createPosition,
    update: updatePosition,
    remove: deletePosition,
    loading,
    error,
  } = useMutations();
  const { execute } = apiHooks<Position>();
  const { execute: executeVoid } = apiHooks<void>();

  const updatePositionByForeignIds = useCallback(
    (person_id: string, tribe_id: string, data: PositionUpdate) =>
      execute(() =>
        positionService.updateByForeignIds(person_id, tribe_id, data),
      ),
    [execute],
  );

  const deletePositionByForeignIds = useCallback(
    (person_id: string, tribe_id: string) =>
      executeVoid(() =>
        positionService.deleteByForeignIds(person_id, tribe_id),
      ),
    [executeVoid],
  );

  return {
    createPosition,
    updatePosition,
    deletePosition,
    updatePositionByForeignIds,
    deletePositionByForeignIds,
    loading,
    error,
  };
}
