import { apiHooks } from '@/platform/api/api-hooks.ts';
import { createEntityHooks } from '@/hooks/useEntityCrud';

import { useEffect } from 'react';

import {
  Role,
  RoleCreate,
  RoleUpdate,
  RoleWithPermissions,
} from './role.types';
import { roleService } from './role.service';

const { useList, useById, useMutations } = createEntityHooks<
  Role,
  RoleCreate,
  RoleUpdate
>(roleService, 'roles');

export function rolesHooks() {
  const { items: roles, ...rest } = useList();
  return { roles, ...rest };
}

export function useRole(id: string | null) {
  const { item: role, ...rest } = useById(id);
  return { role, ...rest };
}

export function useRolesWithPermissions() {
  const {
    data: roles,
    loading,
    error,
    execute,
  } = apiHooks<RoleWithPermissions[]>();
  useEffect(() => {
    execute(() => roleService.getAllWithPermissions());
  }, [execute]);
  return {
    roles: roles ?? [],
    loading,
    error,
    refetch: () => execute(() => roleService.getAllWithPermissions()),
  };
}

export function useRoleMutations() {
  const {
    create: createRole,
    update: updateRole,
    remove: deleteRole,
    ...rest
  } = useMutations();
  return { createRole, updateRole, deleteRole, ...rest };
}
