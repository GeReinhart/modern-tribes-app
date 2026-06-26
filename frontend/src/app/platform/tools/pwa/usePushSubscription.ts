import { useEffect } from 'react';
import { pushService } from '@/app/platform/tools/pwa/push.service.ts';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

async function subscribeIfNeeded(registration: ServiceWorkerRegistration): Promise<void> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return;

  const vapidPublicKey = await pushService.getVapidPublicKey();
  if (!vapidPublicKey) return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  await pushService.subscribe(subscription);
}

export function usePushSubscription(): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready
      .then(subscribeIfNeeded)
      .catch(() => {
        // Push subscription is best-effort; silent failure
      });
  }, []);
}
