import { useEffect } from 'react';
import { userService } from '../services/user.service';
import { User, UserCreate, UserUpdate, UserWithRolesAndPermissions } from '../types/user.types';
import { useApi } from './useApi';
import { createEntityHooks } from './useEntityCrud';

const { useList, useById, useMutations } = createEntityHooks<User, UserCreate, UserUpdate>(userService, 'users');

export function useUsers() {
    const { items: users, ...rest } = useList();
    return { users, ...rest };
}

export function useUser(id: string | null) {
    const { item: user, ...rest } = useById(id);
    return { user, ...rest };
}

export function useUsersWithRolesAndPermissions() {
    const { data: users, loading, error, execute } = useApi<UserWithRolesAndPermissions[]>();
    useEffect(() => {
        execute(() => userService.getAllWithRolesAndPermissions());
    }, [execute]);
    return { users: users ?? [], loading, error, refetch: () => execute(() => userService.getAllWithRolesAndPermissions()) };
}

export function useUserWithRolesAndPermissions(id: string | null) {
    const { data: user, loading, error, execute } = useApi<UserWithRolesAndPermissions>();
    useEffect(() => {
        if (id) execute(() => userService.getByIdWithRolesAndPermissions(id));
    }, [id, execute]);
    return { user, loading, error };
}

export function useUserMutations() {
    const { create: createUser, update: updateUser, remove: deleteUser, ...rest } = useMutations();
    return { createUser, updateUser, deleteUser, ...rest };
}
