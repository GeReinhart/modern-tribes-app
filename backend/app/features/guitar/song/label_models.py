from typing import List, Optional

from pydantic import BaseModel


class GuitarSongLabel(BaseModel):
    id: str
    name: str
    color: str
    position: int


class GuitarSongLabelCreate(BaseModel):
    name: str
    color: str = "#6b7280"


class GuitarSongLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class GuitarSongLabelsReorderRequest(BaseModel):
    ordered_ids: List[str]
