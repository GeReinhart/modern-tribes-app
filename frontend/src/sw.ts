/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const { message, url_param_id } = event.data.json() as {
    message: string;
    url_param_id?: string;
  };

  const showAndAck = self.registration
    .showNotification('Modern Tribes', {
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url_param_id },
    })
    .then(() => {
      if (!url_param_id) return;
      return fetch('/api/platform/tools/notifications/push/received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url_param_id }),
      });
    });

  event.waitUntil(showAndAck);
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const focused = clients.find((c) => c.focused);
        if (focused) return focused.focus();
        if (clients.length > 0) return clients[0].focus();
        return self.clients.openWindow('/');
      }),
  );
});
