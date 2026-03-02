import { projectService } from '../services/project.service';
import { Project, ProjectCreate, ProjectUpdate } from '../types/project.types';
import { createEntityHooks } from './useEntityCrud';

const { useList, useById, useMutations } = createEntityHooks<Project, ProjectCreate, ProjectUpdate>(projectService, 'projects');

export function useProjects() {
    const { items: projects, ...rest } = useList();
    return { projects, ...rest };
}

export function useProject(id: string | null) {
    const { item: project, ...rest } = useById(id);
    return { project, ...rest };
}

export function useProjectMutations() {
    const { create: createProject, update: updateProject, remove: deleteProject, ...rest } = useMutations();
    return { createProject, updateProject, deleteProject, ...rest };
}
