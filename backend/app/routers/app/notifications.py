from typing import List

from fastapi import APIRouter, Depends, status

from ..auth.authentification import get_current_user
from ..auth.authorization import require_permission_decorator
from ...core.database import get_database
from ...models.app.notification import (
    NotificationCreate, NotificationResponse,
    NotificationStatusUpdate,
)
from ...models.auth.auth import PermissionEnum
from ...services import notification_service

router = APIRouter(prefix="/notifications", tags=["app_notifications"])


@router.post("/admin", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def admin_create_notification(
    payload: NotificationCreate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await notification_service.create_for_user(
        pool,
        str(payload.target_user_id),
        payload.message,
        current_user["id"],
    )


@router.get("/pending", response_model=List[NotificationResponse])
async def get_pending_notifications(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await notification_service.list_pending(pool, current_user["id"])


@router.patch("/{notification_id}/status", response_model=NotificationResponse)
async def report_notification_status(
    notification_id: str,
    payload: NotificationStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await notification_service.report_status(
        pool,
        notification_id,
        current_user["id"],
        payload.notification_status.value,
    )
