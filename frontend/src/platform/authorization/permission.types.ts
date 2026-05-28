import { BaseEntity } from '@/types/common.types';

export interface Permission extends BaseEntity {
  name: string;
  description?: string;
}

export interface PermissionCreate {
  name: string;
  description?: string;
}

export interface PermissionUpdate {
  name?: string;
  description?: string;
  status?: string;
}

export interface PermissionWithUsers extends Permission {
  user_count: number;
  users?: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
}
