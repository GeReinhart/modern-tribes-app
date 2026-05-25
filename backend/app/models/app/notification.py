from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


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
