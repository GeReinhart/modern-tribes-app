import { useAuth } from '@/platform/core/authentication/AuthContext.tsx';
import { useNotificationPoller } from '@/hooks/useNotificationPoller.ts';

import React from 'react';

function ActivePoller(): null {
  useNotificationPoller();
  return null;
}

export function NotificationsPoller(): React.ReactElement | null {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ActivePoller /> : null;
}
