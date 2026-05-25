from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.uploads.files import AttachmentFile


class TribeProjectResponse(BaseModel):
    id: str
    tribe_id: str
    project_id: str
    relation: str
    created_at: datetime
    project_name: str = ""


class PositionData(BaseModel):
    person_id: str
    position: str  # "manager", "member", or "guest"


class TribeWithPositionsCreate(BaseModel):
    name: str
    document_content_html: str
    document_attachments: List[AttachmentFile] = []
    positions: List[PositionData]


class TribeWithPositionsUpdate(BaseModel):
    name: Optional[str] = None
    document_content_html: Optional[str] = None
    document_attachments: Optional[List[AttachmentFile]] = None
    positions: Optional[List[PositionData]] = None


class PersonWithPosition(BaseModel):
    id: str
    first_name: str
    last_name: str
    gender: str
    document_id: Optional[str] = None
    position: str
    position_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class TribeWithPositionsResponse(BaseModel):
    id: str
    url_param_id: str
    name: str
    document_id: str
    document_content_html: str
    document_attachments: List[AttachmentFile] = []
    projects: List[TribeProjectResponse] = []
    persons: List[PersonWithPosition]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)