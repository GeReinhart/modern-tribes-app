import { UserPersonPositionTribe } from '@/features/tribes-projects/tribes/tribes.query.types.ts';

import { useCallback, useEffect, useState } from 'react';

import { tribeService } from '@/features/tribes-projects/tribes/tribe.service.ts';
import {
  Tribe,
  TribeCreate,
  TribeProject,
  TribeUpdate,
  TribeWithPersonsWithPosition,
  TribeWithPositions,
} from '@/features/tribes-projects/tribes/tribe.types.ts';
import { apiHooks } from '@/platform/core/api/api-hooks.ts';

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const { loading, error, execute } = apiHooks<Tribe[]>();

  const fetchTribes = useCallback(async () => {
    try {
      const data = await execute(() => tribeService.getAll());
      if (data) setTribes(data);
    } catch (error) {
      console.error('Error fetching tribes:', error);
    }
  }, [execute]);

  useEffect(() => {
    fetchTribes();
  }, [fetchTribes]);

  return {
    tribes,
    loading,
    error,
    refetch: fetchTribes,
  };
}

export function useUserTribes(
  userId: string,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const [tribes, setTribes] = useState<UserPersonPositionTribe[]>([]);
  const { loading, error, execute } = apiHooks<UserPersonPositionTribe[]>();

  const fetchTribes = useCallback(async () => {
    if (!userId) return; // Guard clause

    try {
      const data = await execute(() => tribeService.getAllByUser(userId));
      if (data) setTribes(data);
    } catch (error) {
      console.error('Error fetching tribes:', error);
    }
  }, [execute, userId]);

  useEffect(() => {
    if (enabled && userId) {
      // Only fetch if enabled and userId exists
      fetchTribes();
    }
  }, [fetchTribes, enabled, userId]);

  return {
    tribes,
    loading,
    error,
    refetch: fetchTribes,
  };
}

export function useTribe(id: string | null) {
  const { data: tribe, loading, error, execute } = apiHooks<Tribe>();

  useEffect(() => {
    if (id) {
      execute(() => tribeService.getById(id));
    }
  }, [id, execute]);

  return { tribe, loading, error };
}

export function useTribePositions(id: string) {
  const [tribePositions, setTribePositions] = useState<TribeWithPositions>();
  const { loading, error, execute } = apiHooks<TribeWithPositions>();

  const fetchTribePositions = useCallback(async () => {
    try {
      const data = await execute(() => tribeService.getTribePositions(id));
      if (data) setTribePositions(data);
    } catch (error) {
      console.error('Error fetching tribes:', error);
    }
  }, [execute, id]);

  useEffect(() => {
    fetchTribePositions();
  }, [fetchTribePositions]);

  return {
    tribePositions,
    loading,
    error,
    refetch: fetchTribePositions,
  };
}

export function useTribePersonsPosition(id: string) {
  const {
    data: tribePersonsPosition,
    loading,
    error,
    execute,
  } = apiHooks<TribeWithPersonsWithPosition>();

  useEffect(() => {
    if (id) {
      execute(() => tribeService.getTribePersonsPosition(id));
    }
  }, [id, execute]);

  return { tribePersonsPosition, loading, error };
}

export function useTribeProjects(id: string | null) {
  const [tribeProjects, setTribeProjects] = useState<TribeProject[]>([]);
  const [hasFetched, setHasFetched] = useState(!id);
  const { loading, error, execute } = apiHooks<TribeProject[]>();

  const fetch = useCallback(async () => {
    if (!id) {
      setHasFetched(true);
      return;
    }
    try {
      const data = await execute(() => tribeService.getTribeProjects(id));
      if (data) setTribeProjects(data);
    } catch (err) {
      console.error('Error fetching tribe projects:', err);
    }
    setHasFetched(true);
  }, [id, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { tribeProjects, loading, hasFetched, error };
}

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
