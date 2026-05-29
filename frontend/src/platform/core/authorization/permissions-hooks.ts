import { createEntityHooks } from '@/platform/core/api/useEntityCrud.ts';

import {
  Permission,
  PermissionCreate,
  PermissionUpdate,
} from './permission.types.ts';
import { permissionService } from './permission.service.ts';

const { useList, useById, useMutations } = createEntityHooks<
  Permission,
  PermissionCreate,
  PermissionUpdate
>(permissionService, 'permissions');

export function permissionsHooks() {
  const { items: permissions, ...rest } = useList();
  return { permissions, ...rest };
}

export function usePermission(id: string | null) {
  const { item: permission, ...rest } = useById(id);
  return { permission, ...rest };
}

export function usePermissionMutations() {
  const {
    create: createPermission,
    update: updatePermission,
    remove: deletePermission,
    ...rest
  } = useMutations();
  return { createPermission, updatePermission, deletePermission, ...rest };
}
