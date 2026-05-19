export interface TodoItem {
    id: string;
    feature_instance_id: string;
    title: string;
    status: 'todo' | 'done';
    document_id: string | null;
    document_content_html: string | null;
    position: number;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

export interface TodoItemCreate {
    feature_instance_id: string;
    title: string;
    position?: number;
}

export interface TodoItemUpdate {
    title?: string;
    status?: string;
    position?: number;
    document_content_html?: string;
}
