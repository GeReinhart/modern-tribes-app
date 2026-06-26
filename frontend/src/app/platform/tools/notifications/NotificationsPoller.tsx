import { useAuth } from '@/app/platform/core/authentication/AuthContext.tsx';
import { useNotificationPoller } from '@/app/platform/tools/notifications/useNotificationPoller.ts';
import { usePushSubscription } from '@/app/platform/tools/pwa/usePushSubscription.ts';

import React from 'react';

function ActivePoller(): null {
  useNotificationPoller();
  usePushSubscription();
  return null;
}

export function NotificationsPoller(): React.ReactElement | null {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ActivePoller /> : null;
}
