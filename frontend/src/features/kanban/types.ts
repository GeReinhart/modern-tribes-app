export interface KanbanLabel {
    id: string;
    name: string;
    color: string;
    position: number;
}

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
    size: number | null;
    label_ids: string[];
}

export interface KanbanBoard {
    columns: KanbanColumn[];
    cards: KanbanCard[];
    labels: KanbanLabel[];
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
    size?: number | null;
    clear_size?: boolean;
}

export interface ColumnCreate {
    feature_instance_id: string;
    name: string;
}

export interface LabelCreate {
    feature_instance_id: string;
    name: string;
    color: string;
}

export interface LabelUpdate {
    name?: string;
    color?: string;
}

export type MoveDirection = 'prev' | 'next';
export type ReorderDirection = 'up' | 'down';

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

export function fibColor(size: number | null): string {
    if (size === null) return '';
    const idx = FIBONACCI.indexOf(size as typeof FIBONACCI[number]);
    if (idx === -1) return '';
    const hue = 120 - (idx / (FIBONACCI.length - 1)) * 120;
    return `hsl(${Math.round(hue)}, 65%, 45%)`;
}
