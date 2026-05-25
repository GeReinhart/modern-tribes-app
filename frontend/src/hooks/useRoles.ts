import { useEffect } from 'react';

import { roleService } from '../services/role.service';
import {
  Role,
  RoleCreate,
  RoleUpdate,
  RoleWithPermissions,
} from '../types/role.types';
import { useApi } from './useApi';
import { createEntityHooks } from './useEntityCrud';

const { useList, useById, useMutations } = createEntityHooks<
  Role,
  RoleCreate,
  RoleUpdate
>(roleService, 'roles');

export function useRoles() {
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
  } = useApi<RoleWithPermissions[]>();
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
