import { BaseEntity } from './common.types';
import {Role} from "@/types/role.types.ts";

export interface User extends BaseEntity {
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
}

export interface UserWithRolesAndPermissions extends BaseEntity {
    email: string;
    login: string;
    role_ids: string[];
    roles: Role[];
    permissions: string[];
    person_id?: string | null;
}
