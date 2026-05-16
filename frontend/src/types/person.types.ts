import {PositionEnum} from "@/types/position.types.ts";

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface PersonBase {
    first_name: string;
    last_name: string;
    gender: Gender;
    document_id?: string | null;
}

export interface PersonCreate extends PersonBase {}

export interface PersonUpdate {
    first_name?: string;
    last_name?: string;
    gender?: Gender;
    document_id?: string | null;
    status?: string;
}

export interface Person extends PersonBase {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
}


export interface PersonWithPosition extends PersonBase {
    id: string;
    created_at: string;
    updated_at: string;
    position: PositionEnum,
    position_id: string
}