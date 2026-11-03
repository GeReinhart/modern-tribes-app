import json
import logging

from app.platform.core.config import DEFAULT_VAPID_SUBJECT, settings
from app.platform.tools.notifications import push_repository

logger = logging.getLogger(__name__)


def _is_vapid_configured() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)


def _vapid_subject() -> str:
    """Normalize the configured subject: blank -> default, bare email -> mailto: link."""
    subject = (settings.VAPID_SUBJECT or "").strip().strip("\"'").strip()
    if not subject:
        return DEFAULT_VAPID_SUBJECT
    if subject.startswith(("mailto:", "https://")):
        return subject
    return f"mailto:{subject}"


def _is_expired(exc) -> bool:
    # requests.Response is falsy for 4xx/5xx, so compare with None explicitly.
    return exc.response is not None and exc.response.status_code in (404, 410)


def _send_one(subscription_info: dict, message: str, url_param_id: str) -> bool | None:
    """Returns True if delivered, None if the subscription is expired, False otherwise."""
    from pywebpush import webpush, WebPushException
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"message": message, "url_param_id": url_param_id}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": _vapid_subject()},
            ttl=86400,
            headers={"Urgency": "high"},
        )
        return True
    except WebPushException as exc:
        if _is_expired(exc):
            return None
        logger.warning("WebPush delivery failed: %s", exc)
        return False
    except Exception:
        logger.exception("WebPush signing or delivery error")
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
