from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class MailBase(BaseModel):
    subject: str
    content_html: str
    planned_at: datetime
    mail_type: Optional[str] = None


class MailCreate(MailBase):
    mail_status: str = 'not_sent'
    status: str = 'pending'


class MailUpdate(BaseModel):
    subject: Optional[str] = None
    content_html: Optional[str] = None
    mail_type: Optional[str] = None
    mail_status: Optional[str] = None
    planned_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    status: Optional[str] = None


class Mail(MailBase):
    id: str
    mail_status: str
    sent_at: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class MailWithRecipients(Mail):
    recipient_emails: List[str] = []


class MailToBase(BaseModel):
    mail_id: str
    user_id: str


class MailToCreate(MailToBase):
    pass


class MailTo(MailToBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)
