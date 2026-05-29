from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AppConfigBase(BaseModel):
    value: str = Field(..., description="Configuration value")
    description: Optional[str] = Field(None, description="Human-readable description")


class AppConfigCreate(AppConfigBase):
    key: str = Field(..., min_length=1, description="Unique configuration key")


class AppConfigUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None


class AppConfig(AppConfigBase):
    id: str
    key: str
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[str] = None


class AppConfigPublic(BaseModel):
    key: str
    value: str
