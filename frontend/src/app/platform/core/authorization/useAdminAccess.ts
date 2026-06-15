import { useCurrentUserProfile } from '@/app/platform/functions/people/UserProfileContext.tsx';

export interface AdminAccess {
  isAdmin: boolean;
  canManagePeople: boolean;
  canAssignProjects: boolean;
  hasAdminAccess: boolean;
  isLoading: boolean;
}

export function useAdminAccess(): AdminAccess {
  const { user, isLoading } = useCurrentUserProfile();
  const permissions: string[] = user?.permissions ?? [];

  const isAdmin = permissions.includes('admin');
  const canManagePeople = permissions.includes('can_manage_people');
  const canAssignProjects = permissions.includes('can_assign_projects');
  const hasAdminAccess = isAdmin || canManagePeople || canAssignProjects;

  return { isAdmin, canManagePeople, canAssignProjects, hasAdminAccess, isLoading };
}
