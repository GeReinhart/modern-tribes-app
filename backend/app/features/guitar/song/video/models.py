from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


def _validate_url(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.strip()
    if not (value.startswith("http://") or value.startswith("https://")):
        raise ValueError("url must start with http:// or https://")
    return value


class GuitarSongVideoCreate(BaseModel):
    title: Optional[str] = None
    url: str

    _check_url = field_validator("url")(_validate_url)


class GuitarSongVideoUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

    _check_url = field_validator("url")(_validate_url)


class GuitarSongVideoResponse(BaseModel):
    id: str
    song_id: str
    title: Optional[str] = None
    url: str
    position: int
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
