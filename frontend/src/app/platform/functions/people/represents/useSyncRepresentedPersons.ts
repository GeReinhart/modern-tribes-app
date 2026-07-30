import { Represents } from '@/app/platform/functions/people/represents/represents.types.ts';
import { useRepresentsMutations } from '@/app/platform/functions/people/represents/useRepresents.ts';

import { useCallback } from 'react';

export function useSyncRepresentedPersons() {
  const { createRepresents, deleteRepresents } = useRepresentsMutations();

  const syncRepresentedPersons = useCallback(
    async (
      userId: string,
      currentRepresents: Represents[],
      desiredPersonIds: string[],
    ) => {
      const existingIds = currentRepresents.map((r) => r.person_id);
      const toAdd = desiredPersonIds.filter((id) => !existingIds.includes(id));
      const toRemove = currentRepresents.filter(
        (r) => !desiredPersonIds.includes(r.person_id),
      );
      await Promise.all([
        ...toAdd.map((personId) =>
          createRepresents({ user_id: userId, person_id: personId, status: 'active' }),
        ),
        ...toRemove.map((r) => deleteRepresents(r.id)),
      ]);
    },
    [createRepresents, deleteRepresents],
  );

  return { syncRepresentedPersons };
}
