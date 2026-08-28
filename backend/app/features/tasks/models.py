from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PersonOption(BaseModel):
    id: str
    name: str


class TaskReminderCreate(BaseModel):
    remind_at: datetime
    reminder_type: str = 'notification'


class TaskReminderResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    remind_at: datetime
    reminder_type: str
    sent: bool
