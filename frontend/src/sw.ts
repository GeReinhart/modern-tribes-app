/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const { message, url_param_id } = event.data.json() as {
    message: string;
    url_param_id?: string;
  };

  const show = self.registration.showNotification('Modern Tribes', {
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: { url_param_id },
  });

  const ack = url_param_id
    ? show
        .then(() =>
          fetch(`${API_BASE_URL}/platform/tools/notifications/push/received`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url_param_id }),
          }),
        )
        .catch(() => {})
    : show;

  event.waitUntil(ack);
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
