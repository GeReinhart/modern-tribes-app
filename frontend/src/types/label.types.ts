export interface LabelBase {
    name: string;
}

export interface LabelCreate extends LabelBase {}

export interface LabelUpdate {
    name?: string;
}

export interface Label extends LabelBase {
    id: string;
    created_at: string;
    updated_at: string;
}