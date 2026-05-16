export interface ProjectBase {
    name: string;
    document_id: string;
}

export interface ProjectCreate extends ProjectBase {}

export interface ProjectUpdate {
    name?: string;
    document_id?: string;
    status?: string;
}

export interface Project extends ProjectBase {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
}