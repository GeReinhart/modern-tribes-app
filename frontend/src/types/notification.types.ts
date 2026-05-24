export enum NotificationStatus {
    planned = 'planned',
    sent = 'sent',
    failed = 'failed',
}

export interface AppNotification {
    id: string;
    url_param_id: string;
    target_user_id: string;
    message: string;
    sent_at: string | null;
    notification_status: NotificationStatus;
    created_at: string;
}

export interface NotificationCreate {
    target_user_id: string;
    message: string;
}

export interface NotificationStatusUpdate {
    notification_status: NotificationStatus.sent | NotificationStatus.failed;
}

export interface UserSearchResult {
    id: string;
    url_param_id: string;
    login: string;
    email: string;
    full_name: string;
}
