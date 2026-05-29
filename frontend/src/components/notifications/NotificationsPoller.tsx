import { useAuth } from '@/platform/core/authentication/AuthContext';
import { useNotificationPoller } from '@/hooks/useNotificationPoller';

import React from 'react';

function ActivePoller(): null {
  useNotificationPoller();
  return null;
}

export function NotificationsPoller(): React.ReactElement | null {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ActivePoller /> : null;
}
