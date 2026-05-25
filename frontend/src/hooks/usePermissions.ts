import { permissionService } from '../services/permission.service';
import {
  Permission,
  PermissionCreate,
  PermissionUpdate,
} from '../types/permission.types';
import { createEntityHooks } from './useEntityCrud';

const { useList, useById, useMutations } = createEntityHooks<
  Permission,
  PermissionCreate,
  PermissionUpdate
>(permissionService, 'permissions');

export function usePermissions() {
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
