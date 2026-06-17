import { useCurrentUserProfile } from '@/app/platform/functions/people/UserProfileContext.tsx';

export interface AdminAccess {
  isAdmin: boolean;
  canManagePeople: boolean;
  hasAdminAccess: boolean;
  isLoading: boolean;
}

export function useAdminAccess(): AdminAccess {
  const { user, isLoading } = useCurrentUserProfile();
  const permissions: string[] = user?.permissions ?? [];

  const isAdmin = permissions.includes('admin');
  const canManagePeople = permissions.includes('can_manage_people');
  const hasAdminAccess = isAdmin || canManagePeople;

  return { isAdmin, canManagePeople, hasAdminAccess, isLoading };
}
