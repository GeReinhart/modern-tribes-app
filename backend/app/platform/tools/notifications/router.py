from typing import List

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.tools.notifications.models import (
    AdminNotificationResponse,
    NotificationCreate,
    NotificationResponse,
    NotificationStatusUpdate,
    PushReceivedAck,
    PushSubscriptionCreate,
    PushSubscriptionDelete,
    PushSubscriptionResponse,
)
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator
from app.platform.tools.notifications import service as notification_service
from app.platform.tools.notifications import push_service
from app.platform.tools.notifications import repository as notification_repo

router = APIRouter(prefix="/notifications", tags=["platform_tools"])


@router.get("/admin", response_model=List[AdminNotificationResponse])
@require_permission_decorator(PermissionEnum.ADMIN)
async def admin_list_notifications(current_user: dict = Depends(get_current_user)):
    """List all notifications (admin only).

    **Permissions:** admin
    """
    pool = get_database()
    return await notification_service.list_all(pool)


@router.post("/admin", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def admin_create_notification(
    payload: NotificationCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a notification for a specific user (admin only).

    **Permissions:** admin
    """
    pool = get_database()
    return await notification_service.create_for_user(
        pool,
        str(payload.target_user_id),
        payload.message,
        current_user["id"],
    )


@router.get("/pending", response_model=List[NotificationResponse])
async def get_pending_notifications(current_user: dict = Depends(get_current_user)):
    """Get all pending notifications for the current user.

    **Permissions:** authentication required — no specific permission
    """
    pool = get_database()
    return await notification_service.list_pending(pool, current_user["id"])


@router.patch("/{notification_id}/status", response_model=NotificationResponse)
async def report_notification_status(
    notification_id: str,
    payload: NotificationStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the status of a notification.

    **Permissions:** authentication required — no specific permission
    """
    pool = get_database()
    return await notification_service.report_status(
        pool,
        notification_id,
        current_user["id"],
        payload.notification_status.value,
    )


@router.post("/push/received", status_code=status.HTTP_204_NO_CONTENT)
async def push_notification_received(payload: PushReceivedAck):
    """Called by the service worker when a push notification is displayed on device.

    No authentication required — the url_param_id acts as a delivery token.
    Only transitions planned → sent, so replaying it is safe.
    """
    pool = get_database()
    await notification_repo.mark_push_received(pool, payload.url_param_id)


@router.get("/push/vapid-public-key")
async def get_vapid_public_key(_: dict = Depends(get_current_user)):
    """Return the VAPID public key for push subscription.

    **Permissions:** authentication required
    """
    return {"vapid_public_key": push_service.get_vapid_public_key()}


@router.post(
    "/push/subscribe",
    response_model=PushSubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def subscribe_push(
    payload: PushSubscriptionCreate,
    current_user: dict = Depends(get_current_user),
):
    """Register a push subscription for the current user.

    **Permissions:** authentication required
    """
    pool = get_database()
    result = await push_service.register(
        pool,
        current_user["id"],
        str(payload.endpoint),
        payload.p256dh,
        payload.auth,
    )
    return result


@router.delete("/push/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe_push(
    payload: PushSubscriptionDelete,
    current_user: dict = Depends(get_current_user),
):
    """Remove a push subscription for the current user.

    **Permissions:** authentication required
    """
    pool = get_database()
    await push_service.unregister(pool, current_user["id"], str(payload.endpoint))
