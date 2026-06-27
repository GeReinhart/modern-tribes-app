import { notificationService } from '@/app/platform/tools/notifications/notification.service.ts';
import {
  AppNotification,
  NotificationStatus,
} from '@/app/platform/tools/notifications/notification.types.ts';

import { useCallback, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 60_000;
const APP_NAME = 'Modern Tribes';

async function displayBrowserNotification(
  notification: AppNotification,
): Promise<boolean> {
  const options: NotificationOptions = {
    body: notification.message,
    tag: notification.id,
  };
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(APP_NAME, options);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  try {
    new Notification(APP_NAME, options);
    return true;
  } catch {
    return false;
  }
}

async function requestPermissionIfNeeded(): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export function useNotificationPoller(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processPendingNotifications = useCallback(async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted')
      return;
    try {
      const pending = await notificationService.listPending();
      for (const notification of pending) {
        const displayed = await displayBrowserNotification(notification);
        const newStatus = displayed
          ? NotificationStatus.sent
          : NotificationStatus.failed;
        await notificationService.reportStatus(notification.id, newStatus);
      }
    } catch {
      // Silent: network errors are transient; next poll will retry
    }
  }, []);

  useEffect(() => {
    requestPermissionIfNeeded();
    processPendingNotifications();
    intervalRef.current = setInterval(
      processPendingNotifications,
      POLL_INTERVAL_MS,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [processPendingNotifications]);
}
