# Notifications

## For everyone

Modern Tribes can send you alerts in two ways: **inside the app** while you have it open, and **push notifications** on your phone or computer even when the app is closed — just like a messaging app would.

### How it works from your perspective

1. The first time you open the app, your browser asks: *"Allow Modern Tribes to send notifications?"*
2. If you say yes, your device is registered. From that moment, the app can reach you even when you are not looking at it.
3. When something worth your attention happens — an event reminder, a message from an admin — a notification appears on your screen.
4. Tapping it brings you straight back into the app.

### What triggers a notification

- **Event reminders** — you set a reminder on a calendar event; the app notifies every participant before it starts.
- **Admin broadcasts** — a tribe administrator sends a message to all users.

### The fallback

If your device is not registered for push (older browser, permission denied, or the app is running in a tab), the app checks for new notifications every 60 seconds while you have it open and shows them via the browser's built-in notification system.

---

## For engineers

### Architecture overview

```
User action / scheduler
        │
        ▼
notification_service.create_for_user()          ← single entry point
        │
        ├── INSERT INTO notifications (status = 'planned')
        │
        └── push_service.send_to_user()
                │
                ├── [subscriptions found + VAPID configured]
                │       pywebpush signs payload with VAPID private key
                │       → POST to push service (FCM / APNs / Mozilla)
                │       → push service verifies signature against public key
                │       → delivers to device even if app is closed
                │       → UPDATE notifications SET status = 'sent'
                │
                └── [no subscription or push fails]
                        notification stays 'planned'
                        frontend poller picks it up within 60 s
                        calls new Notification() (browser API)
                        → PATCH /notifications/{id}/status  → 'sent'
```

### Components

#### Backend

| File | Role |
|---|---|
| `app/platform/tools/notifications/service.py` | Single entry point — creates DB record then attempts push |
| `app/platform/tools/notifications/push_service.py` | VAPID signing and delivery via `pywebpush`; removes expired subscriptions (HTTP 404/410) |
| `app/platform/tools/notifications/push_repository.py` | DB access for `push_subscriptions` (upsert / delete / list) |
| `app/platform/tools/notifications/router.py` | REST endpoints — notifications + push subscribe/unsubscribe + VAPID public key |
| `app/features/events/reminder_scheduler.py` | Background loop — calls `notification_service.create_for_user()` for due reminders |

#### Frontend

| File | Role |
|---|---|
| `src/sw.ts` | Custom service worker — handles `push` events (show notification) and `notificationclick` (focus/open app) |
| `src/app/platform/tools/pwa/usePushSubscription.ts` | On login: fetches VAPID public key, creates `PushSubscription`, registers it with the backend |
| `src/app/platform/tools/pwa/push.service.ts` | API calls for subscribe / unsubscribe / VAPID key |
| `src/app/platform/tools/notifications/useNotificationPoller.ts` | 60 s polling fallback — fetches `planned` notifications, shows them via `new Notification()` |
| `src/app/platform/tools/notifications/NotificationsPoller.tsx` | Mounts both the poller and the push subscription hook when the user is authenticated |

#### Database

```sql
-- push_subscriptions (migration 003)
-- One row per browser/device per user.
-- Removed automatically when the push service returns 404/410 (expired subscription).
push_subscriptions (
    id, user_id, endpoint, p256dh, auth, status,
    created_at, updated_at, created_by, updated_by
)

-- notifications (existing)
-- status lifecycle: planned → sent | failed
notifications (
    id, url_param_id, target_user_id, message,
    notification_status, sent_at, status,
    created_at, updated_at, created_by, updated_by
)
```

### VAPID

**What it is.** VAPID (Voluntary Application Server Identification) is the protocol push services use to verify that a push request comes from the legitimate application server. It uses an asymmetric key pair: the server signs every push with the private key; the push service verifies against the public key it received at subscription time.

**Why it is required.** Without VAPID, any party holding a subscription endpoint URL could send arbitrary notifications. All major push services (Chrome/FCM, Firefox, Safari/APNs) now mandate VAPID — unsigned requests are rejected.

**Key lifecycle.**
- Generated once (`py-vapid` CLI or `python -m pywebpush --vapid-info`).
- Public key is served to the frontend at subscription time via `GET /notifications/push/vapid-public-key`.
- Private key never leaves the server — stored in `.env` as `VAPID_PRIVATE_KEY`.
- Rotating the key pair invalidates all existing subscriptions; users re-subscribe silently on next login.

**Configuration** (`.env`):

```
VAPID_PUBLIC_KEY=<url-safe base64 — 65 bytes uncompressed EC public key>
VAPID_PRIVATE_KEY=<url-safe base64 — 32 bytes EC private key>
VAPID_SUBJECT=mailto:admin@your-domain.com
```

Generate with:

```bash
cd backend
./venv/bin/python -c "
from py_vapid import Vapid
import base64
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

v = Vapid()
v.generate_keys()

pub = v.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
pub_key = base64.urlsafe_b64encode(pub).rstrip(b'=').decode()

raw_int = v._private_key.private_numbers().private_value
priv_key = base64.urlsafe_b64encode(raw_int.to_bytes(32, 'big')).rstrip(b'=').decode()

print('VAPID_PUBLIC_KEY=' + pub_key)
print('VAPID_PRIVATE_KEY=' + priv_key)
"
```

> The public key is the uncompressed EC point (65 bytes, 87-char base64) — the format browsers require for `applicationServerKey`.  
> The private key is the raw 32-byte scalar — the format `pywebpush` expects internally.

### Notification flow — step by step

1. A user logs in → `usePushSubscription` runs.
2. Browser checks `Notification.permission`. If `'granted'`, it calls `pushManager.subscribe()` with the VAPID public key.
3. The browser registers with its push service and returns a `PushSubscription` object containing `endpoint`, `p256dh` (encryption key) and `auth` (authentication secret).
4. The frontend POSTs these to `POST /notifications/push/subscribe`. The backend upserts a row in `push_subscriptions`.
5. When a notification must be sent (reminder fires, admin broadcasts), `notification_service.create_for_user()` is called.
6. It inserts a `notifications` row (`status = 'planned'`), then calls `push_service.send_to_user()`.
7. `push_service` queries `push_subscriptions` for the user, calls `pywebpush.webpush()` for each, which signs the payload and POSTs to the push service endpoint.
8. The push service delivers to the device. The service worker's `push` handler fires and calls `self.registration.showNotification()`.
9. On success, the `notifications` row is updated to `status = 'sent'`. The frontend poller will not pick it up again.
10. If the push service responds 404/410 (subscription expired), the stale row is deleted from `push_subscriptions`.
11. If push is unavailable (no VAPID config, no subscriptions, or delivery error), the notification stays `'planned'`. The 60 s poller fetches it, displays it via `new Notification()`, then PATCHes the status to `'sent'`.

### Adding a new notification trigger

1. Call `notification_service.create_for_user(pool, user_id, message, actor_user_id)`.
2. That is the only call needed — push + fallback + DB tracking are all handled internally.
