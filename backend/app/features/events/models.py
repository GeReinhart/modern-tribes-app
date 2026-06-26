from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    feature_instance_id: str
    title: str
    start_at: datetime
    end_at: datetime
    all_day: bool = False
    document_content_html: Optional[str] = None
    size: Optional[int] = None
    force_on_dashboard: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    all_day: Optional[bool] = None
    document_content_html: Optional[str] = None
    size: Optional[int] = None
    clear_size: bool = False
    force_on_dashboard: Optional[bool] = None


class EventParticipantInfo(BaseModel):
    person_id: str
    person_name: str


class EventReminderCreate(BaseModel):
    remind_at: datetime
    reminder_type: str = 'notification'


class EventReminderResponse(BaseModel):
    id: str
    event_id: str
    remind_at: datetime
    reminder_type: str
    sent: bool


class EventResponse(BaseModel):
    id: str
    feature_instance_id: str
    title: str
    start_at: datetime
    end_at: datetime
    all_day: bool
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    size: Optional[int] = None
    force_on_dashboard: bool = False
    status: str
    participant_ids: list[str] = []
    participants: list[EventParticipantInfo] = []
    label_ids: list[str] = []
    reminders: list[EventReminderResponse] = []
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class PlanningEventLabel(BaseModel):
    id: str
    name: str
    color: str
    position: int = 0


class PlanningEventResponse(EventResponse):
    feature_instance_name: str
    project_id: str
    project_url_param_id: Optional[str] = None
    project_name: str
    labels: list[PlanningEventLabel] = []
