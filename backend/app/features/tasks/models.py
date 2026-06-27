from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PersonOption(BaseModel):
    id: str
    name: str


class FeatureLabel(BaseModel):
    id: str
    name: str
    color: str
    position: int


class FeatureLabelCreate(BaseModel):
    feature_instance_id: str
    name: str
    color: str = '#6b7280'


class FeatureLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


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
