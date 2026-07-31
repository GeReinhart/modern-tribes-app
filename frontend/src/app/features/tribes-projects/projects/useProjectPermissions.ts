import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';

import { useMemo } from 'react';

import { ProjectEntry } from './projects.query.types.ts';
import { useUserProjectsByTribe } from './useProjects.ts';

export function useProjectPermissions(tribeId: string | null, projectId: string | null) {
  const { user } = useCurrentUserProfile();
  const { projects: tribeProjects } = useUserProjectsByTribe(
    tribeId || '',
    user?.id || '',
    { enabled: !!tribeId && !!user?.id },
  );

  const myProjectPosition = useMemo((): ProjectEntry | null => {
    if (!projectId) return null;
    const rows = tribeProjects.filter((r) => r.project_url_param_id === projectId);
    if (rows.length === 0) return null;
    const entry: ProjectEntry = {
      project_id: projectId,
      project_url_param_id: rows[0].project_url_param_id,
      project_name: rows[0].project_name,
      direct_position: null,
      represented_persons: [],
    };
    for (const r of rows) {
      if (!r.via_represents) entry.direct_position = r.effective_position;
      else if (r.person_first_name && r.person_last_name)
        entry.represented_persons.push({
          first_name: r.person_first_name,
          last_name: r.person_last_name,
          position: r.effective_position,
        });
    }
    return entry;
  }, [projectId, tribeProjects]);

  const isManager = useMemo(
    () =>
      !myProjectPosition
        ? false
        : myProjectPosition.direct_position === 'manager' ||
          myProjectPosition.represented_persons.some((p) => p.position === 'manager'),
    [myProjectPosition],
  );

  const canEdit = useMemo(() => {
    if (user?.permissions?.includes('admin')) return true;
    if (!myProjectPosition) return false;
    return [
      myProjectPosition.direct_position,
      ...myProjectPosition.represented_persons.map((p) => p.position),
    ]
      .filter(Boolean)
      .some((p) => p === 'manager' || p === 'member');
  }, [myProjectPosition, user]);

  return { isManager, canEdit };
}
