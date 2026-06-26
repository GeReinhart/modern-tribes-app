from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class NotificationStatus(str, Enum):
    planned = "planned"
    sent = "sent"
    failed = "failed"


class NotificationCreate(BaseModel):
    target_user_id: UUID
    message: str


class NotificationStatusUpdate(BaseModel):
    notification_status: NotificationStatus


class NotificationResponse(BaseModel):
    id: UUID
    url_param_id: str
    target_user_id: UUID
    message: str
    sent_at: datetime | None
    notification_status: NotificationStatus
    created_at: datetime


class AdminNotificationResponse(BaseModel):
    id: UUID
    url_param_id: str
    target_user_id: UUID
    target_user_email: str
    message: str
    sent_at: datetime | None
    notification_status: NotificationStatus
    created_at: datetime


class PushSubscriptionCreate(BaseModel):
    endpoint: HttpUrl
    p256dh: str
    auth: str


class PushSubscriptionDelete(BaseModel):
    endpoint: HttpUrl


class PushSubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    endpoint: str
    status: str
    created_at: datetime
