import { Role } from '@/types/role.types.ts';

import { BaseEntity } from './common.types';

export interface User extends BaseEntity {
  url_param_id: string;
  email: string;
  login: string;
  role_ids: string[];
  person_id?: string | null;
}

export interface UserCreate {
  email: string;
  login: string;
  role_ids?: string[];
  person_id?: string | null;
}

export interface UserUpdate {
  email?: string;
  login?: string;
  role_ids?: string[];
  person_id?: string | null;
  status?: string;
}

export interface UserWithRolesAndPermissions extends BaseEntity {
  url_param_id: string;
  email: string;
  login: string;
  role_ids: string[];
  roles: Role[];
  permissions: string[];
  person_id?: string | null;
}
