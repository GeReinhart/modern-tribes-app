from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class GuitarSongAuthorResponse(BaseModel):
    id: str
    project_id: str
    name: str
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
