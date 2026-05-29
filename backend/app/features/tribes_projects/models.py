from datetime import datetime

from pydantic import BaseModel

from app.features.tribes_projects.positions.models import PositionEnum


class TribeProjectInput(BaseModel):
    project_id: str
    relation: PositionEnum


class TribeProject(TribeProjectInput):
    id: str
    tribe_id: str
    created_at: datetime
    project_name: str = ""
