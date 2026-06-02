from typing import List

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.tools.notifications.models import (
    NotificationCreate,
    NotificationResponse,
    NotificationStatusUpdate,
)
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator
from app.platform.tools.notifications import service as notification_service

router = APIRouter(prefix="/notifications", tags=["platform_tools"])


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
