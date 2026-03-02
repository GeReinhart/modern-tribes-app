from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from ..uploads.files import AttachmentFile

class PositionData(BaseModel):
    person_id: str
    position: str  # "chief", "member", or "invite"


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
    name: str
    document_id: str
    document_content_html: str
    document_attachments: List[AttachmentFile] = []
    project_ids: List[str] = []
    persons: List[PersonWithPosition]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)