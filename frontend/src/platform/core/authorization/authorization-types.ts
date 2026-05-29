import { BaseEntity } from '@/types/common.types.ts';

export type PermissionEnum =
  | 'admin'
  | 'can_create_own_tribes'
  | 'can_access_attached_tribes'
  | 'can_manage_own_profile';

export interface Authorization extends BaseEntity {
  authorized: boolean;
  message: string;
}
