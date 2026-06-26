import { apiService } from '@/app/platform/core/api/api.service.ts';

interface VapidKeyResponse {
  vapid_public_key: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

class PushService {
  async getVapidPublicKey(): Promise<string> {
    const data = await apiService.get<VapidKeyResponse>(
      '/platform/tools/notifications/push/vapid-public-key',
    );
    return data.vapid_public_key;
  }

  async subscribe(subscription: PushSubscription): Promise<void> {
    const keys = subscription.toJSON().keys;
    if (!keys) return;
    const payload: PushSubscriptionPayload = {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ?? '',
      auth: keys.auth ?? '',
    };
    await apiService.post('/platform/tools/notifications/push/subscribe', payload);
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await apiService.delete('/platform/tools/notifications/push/subscribe', {
      endpoint,
    });
  }
}

export const pushService = new PushService();
