import {Position} from "@/types/position.types.ts";
import {PersonWithPosition} from "@/types/person.types.ts";

export type TribeProjectRelation = 'manager' | 'member' | 'guest';

export interface TribeProjectInput {
    project_id: string;
    relation: TribeProjectRelation;
}

export interface TribeProject extends TribeProjectInput {
    id: string;
    tribe_id: string;
    created_at: string;
    project_name: string;
}

export interface TribeBase {
    name: string;
    document_id?: string | null;
}

export interface TribeCreate extends TribeBase {}

export interface TribeUpdate {
    name?: string;
    document_id?: string | null;
    status?: string;
}

export interface Tribe extends TribeBase {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface TribeWithPositions extends Tribe {
    position_count: number;
    positions?: Position[];
}

export interface TribeWithPersonsWithPosition extends Tribe {
    person_count: number;
    persons?: PersonWithPosition[];
}


