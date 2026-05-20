export interface KanbanColumn {
    id: string;
    name: string;
    position: number;
}

export interface KanbanCard {
    id: string;
    feature_instance_id: string;
    column_id: string;
    title: string;
    assigned_person_id: string | null;
    assigned_person_name: string | null;
    document_id: string | null;
    document_content_html: string | null;
    position: number;
    status: 'pending' | 'active' | 'archived';
}

export interface KanbanBoard {
    columns: KanbanColumn[];
    cards: KanbanCard[];
}

export interface PersonOption {
    id: string;
    name: string;
}

export interface CardCreate {
    feature_instance_id: string;
    column_id: string;
    title: string;
    assigned_person_id?: string | null;
    position?: number;
}

export interface CardUpdate {
    title?: string;
    assigned_person_id?: string | null;
    clear_assignee?: boolean;
    document_content_html?: string;
}

export interface ColumnCreate {
    feature_instance_id: string;
    name: string;
}

export type MoveDirection = 'prev' | 'next';
