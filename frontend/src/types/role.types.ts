import { BaseEntity } from './common.types';
import { Permission } from './permission.types';

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permission_ids: string[];
}

export interface RoleWithPermissions extends BaseEntity {
  name: string;
  description?: string;
  permission_ids: string[];
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permission_ids?: string[];
  status?: string;
}
