import {Project} from "@/types/project.types.ts";
import {Position} from "@/types/position.types.ts";
import {PersonWithPosition} from "@/types/person.types.ts";

export interface TribeBase {
    name: string;
    document_id?: string | null;
    project_ids?: string[];
}

export interface TribeCreate extends TribeBase {}

export interface TribeUpdate {
    name?: string;
    document_id?: string | null;
    project_ids?: string[];
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



export interface TribeWithProjects extends Tribe {
    project_count: number;
    projects?: Project[];
}


