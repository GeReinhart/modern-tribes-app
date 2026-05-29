import { useAuth } from '@/platform/core/authentication/AuthContext.tsx';
import { usePerson } from '@/hooks/usePersons.ts';
import { useUserWithRolesAndPermissions } from '@/hooks/useUsers.ts';
import type { UserWithRolesAndPermissions } from '@/types/user.types.ts';

import React, { createContext, useContext } from 'react';

interface UserProfileContextType {
  authUser: ReturnType<typeof useAuth>['user'];
  user: UserWithRolesAndPermissions | null | undefined;
  person: ReturnType<typeof usePerson>['person'];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const {
    user,
    loading: userLoading,
    error: userError,
  } = useUserWithRolesAndPermissions(authUser?.id ?? null);
  const {
    person,
    loading: personLoading,
    error: personError,
  } = usePerson(user?.person_id ?? null);

  return (
    <UserProfileContext.Provider
      value={{
        authUser,
        user,
        person,
        isLoading: authLoading || userLoading || personLoading,
        isAuthenticated,
        error: userError || personError,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context)
    throw new Error(
      'useCurrentUserProfile must be used within UserProfileProvider',
    );
  return context;
}
