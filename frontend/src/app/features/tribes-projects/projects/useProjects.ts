import { useCallback, useEffect, useState } from 'react';

import { projectService } from '@/app/features/tribes-projects/projects/project.service.ts';
import {
  ProjectWithDocumentCreate,
  ProjectWithDocumentResponse,
  ProjectWithDocumentUpdate,
} from '@/app/features/tribes-projects/projects/project_with_document.types.ts';
import { Project, ProjectCreate, ProjectUpdate } from '@/app/features/tribes-projects/projects/project.types.ts';
import {
  AccessibleProjectWithTribe,
  ArchivedProjectEntry,
  ProjectTribesSummary,
  ProjectTribeWithMembers,
  UserProjectEntry,
} from '@/app/features/tribes-projects/projects/projects.query.types.ts';
import { apiHooks } from '@/app/platform/core/api/api-hooks.ts';
import { createEntityHooks } from '@/app/platform/core/api/useEntityCrud.ts';

const { useList, useById, useMutations } = createEntityHooks<
  Project,
  ProjectCreate,
  ProjectUpdate
>(projectService, 'projects');

export function useProjects() {
  const { items: projects, ...rest } = useList();
  return { projects, ...rest };
}

export function useProject(id: string | null) {
  const { item: project, ...rest } = useById(id);
  return { project, ...rest };
}

export function useProjectMutations() {
  const {
    create: createProject,
    update: updateProject,
    remove: deleteProject,
    ...rest
  } = useMutations();
  return { createProject, updateProject, deleteProject, ...rest };
}

export function useUserProjects(
  userId: string,
  options: { enabled?: boolean } = {},
) {
  const [projects, setProjects] = useState<UserProjectEntry[]>([]);
  const { loading, error, execute } = apiHooks<UserProjectEntry[]>();

  const fetch = useCallback(() => {
    if (!userId) return;
    execute(() => projectService.getByUser(userId)).then((data) => {
      if (data) setProjects(data);
    });
  }, [userId, execute]);

  useEffect(() => {
    if (options.enabled !== false) fetch();
  }, [fetch, options.enabled]);

  return { projects, loading, error, refetch: fetch };
}

export function useUserProjectsByTribe(
  tribeId: string,
  userId: string,
  options: { enabled?: boolean } = {},
) {
  const [projects, setProjects] = useState<UserProjectEntry[]>([]);
  const { loading, error, execute } = apiHooks<UserProjectEntry[]>();

  const fetch = useCallback(() => {
    if (!tribeId || !userId) return;
    execute(() => projectService.getByTribeForUser(tribeId, userId)).then(
      (data) => {
        if (data) setProjects(data);
      },
    );
  }, [tribeId, userId, execute]);

  useEffect(() => {
    if (options.enabled !== false) fetch();
  }, [fetch, options.enabled]);

  return { projects, loading, error, refetch: fetch };
}

export function useReorderProjectsInTribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reorderProjects = useCallback(
    async (tribeId: string, orderedIds: string[]): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await projectService.reorderProjectsInTribe(tribeId, orderedIds);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { reorderProjects, loading, error };
}

export function useProjectWithDocument(projectId: string | null) {
  const [project, setProject] = useState<ProjectWithDocumentResponse | null>(
    null,
  );
  const { loading, error, execute } = apiHooks<ProjectWithDocumentResponse>();

  const fetch = useCallback(() => {
    if (!projectId) return;
    execute(() => projectService.getWithDocument(projectId)).then((data) => {
      if (data) setProject(data);
    });
  }, [projectId, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { project, loading, error, refetch: fetch };
}

export function useProjectWithDocumentMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProjectWithDocument = useCallback(
    async (
      data: ProjectWithDocumentCreate,
    ): Promise<ProjectWithDocumentResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        return await projectService.createWithDocument(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateProjectWithDocument = useCallback(
    async (
      projectId: string,
      data: ProjectWithDocumentUpdate,
    ): Promise<ProjectWithDocumentResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        return await projectService.updateWithDocument(projectId, data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createProjectWithDocument,
    updateProjectWithDocument,
    loading,
    error,
  };
}

export function useProjectTribesWithMembers(projectId: string | null) {
  const [tribes, setTribes] = useState<ProjectTribeWithMembers[]>([]);
  const { loading, error, execute } = apiHooks<ProjectTribeWithMembers[]>();

  const fetch = useCallback(() => {
    if (!projectId) return;
    execute(() => projectService.getTribesWithMembers(projectId)).then(
      (data) => {
        if (data) setTribes(data);
      },
    );
  }, [projectId, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { tribes, loading, error, refetch: fetch };
}

export function useArchiveProject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archiveProject = useCallback(async (projectId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await projectService.archive(projectId);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { archiveProject, loading, error };
}

export function useArchivedProjectsByTribe(
  tribeId: string,
  options: { enabled?: boolean } = {},
) {
  const [projects, setProjects] = useState<ArchivedProjectEntry[]>([]);
  const { loading, error, execute } = apiHooks<ArchivedProjectEntry[]>();

  const fetch = useCallback(() => {
    if (!tribeId) return;
    execute(() => projectService.getArchivedByTribe(tribeId)).then((data) => {
      if (data) setProjects(data);
    });
  }, [tribeId, execute]);

  useEffect(() => {
    if (options.enabled !== false) fetch();
  }, [fetch, options.enabled]);

  return { projects, loading, error, refetch: fetch };
}

export function useUnarchiveProject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unarchiveProject = useCallback(async (projectId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await projectService.unarchive(projectId);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { unarchiveProject, loading, error };
}

export function useProjectTribes() {
  const [projectTribes, setProjectTribes] = useState<Record<string, string[]>>({});
  const { loading, error, execute } = apiHooks<ProjectTribesSummary[]>();

  const fetch = useCallback(async () => {
    try {
      const data = await execute(() => projectService.getTribesPerProject());
      if (data) {
        const map: Record<string, string[]> = {};
        for (const entry of data) map[entry.project_id] = entry.tribe_names;
        setProjectTribes(map);
      }
    } catch {
      console.error('Error fetching project tribes');
    }
  }, [execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projectTribes, loading, error };
}

export function useAccessibleProjectsWithTribes(userId: string) {
  const [projects, setProjects] = useState<AccessibleProjectWithTribe[]>([]);
  const { loading, error, execute } = apiHooks<AccessibleProjectWithTribe[]>();

  const fetch = useCallback(() => {
    if (!userId) return;
    execute(() => projectService.getAccessibleWithTribes(userId)).then((data) => {
      if (data) setProjects(data);
    });
  }, [userId, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projects, loading, error };
}
