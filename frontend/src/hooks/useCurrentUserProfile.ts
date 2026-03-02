import { useAuth } from '@/contexts/AuthContext';
import { useUserWithRolesAndPermissions} from '@/hooks/useUsers';
import { usePerson } from '@/hooks/usePersons';

export function useCurrentUserProfile() {
    const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();

    const { user, loading: userLoading, error: userError } = useUserWithRolesAndPermissions(authUser?.id || null);
    const { person, loading: personLoading, error: personError } = usePerson(user?.person_id || null);

    return {
        authUser,
        user,
        person,
        isLoading: authLoading || userLoading || personLoading,
        isAuthenticated,
        error: userError || personError,
    };
}