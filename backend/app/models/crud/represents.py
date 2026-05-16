from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class RepresentsBase(BaseModel):
    user_id: str
    person_id: str


class RepresentsCreate(RepresentsBase):
    status: str = 'active'


class RepresentsUpdate(BaseModel):
    user_id: Optional[str] = None
    person_id: Optional[str] = None
    status: Optional[str] = None


class Represents(RepresentsBase):
    id: str
    status: str = 'active'
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)
