import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationPoller } from '@/hooks/useNotificationPoller';

function ActivePoller(): null {
    useNotificationPoller();
    return null;
}

export function NotificationsPoller(): React.ReactElement | null {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <ActivePoller /> : null;
}
