from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from .positions import PositionEnum


class TribeProjectInput(BaseModel):
    project_id: str
    relation: PositionEnum


class TribeProject(TribeProjectInput):
    id: str
    tribe_id: str
    created_at: datetime
    project_name: str = ""
