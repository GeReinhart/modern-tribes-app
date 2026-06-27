import json
import logging

from app.platform.core.config import settings
from app.platform.tools.notifications import push_repository

logger = logging.getLogger(__name__)


def _is_vapid_configured() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)


def _send_one(subscription_info: dict, message: str, url_param_id: str) -> bool:
    from pywebpush import webpush, WebPushException
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"message": message, "url_param_id": url_param_id}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
        )
        return True
    except WebPushException as exc:
        if exc.response and exc.response.status_code in (404, 410):
            return None  # subscription expired — caller should remove it
        logger.warning("WebPush delivery failed: %s", exc)
        return False


async def send_to_user(pool, user_id: str, message: str, url_param_id: str) -> bool:
    """Send a push to all active subscriptions for the user.

    Returns True if at least one push was delivered.
    """
    if not _is_vapid_configured():
        return False

    subscriptions = await push_repository.list_for_user(pool, user_id)
    if not subscriptions:
        return False

    any_delivered = False
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
        }
        result = _send_one(subscription_info, message, url_param_id)
        if result is None:
            await push_repository.delete_by_endpoint(pool, sub["endpoint"])
        elif result:
            any_delivered = True

    return any_delivered


async def register(pool, user_id: str, endpoint: str, p256dh: str, auth: str) -> dict:
    return await push_repository.upsert_subscription(pool, user_id, endpoint, p256dh, auth)


async def unregister(pool, user_id: str, endpoint: str) -> bool:
    return await push_repository.delete_subscription(pool, user_id, endpoint)


def get_vapid_public_key() -> str:
    return settings.VAPID_PUBLIC_KEY
