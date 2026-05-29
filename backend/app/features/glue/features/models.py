from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProjectFeatureInstanceBase(BaseModel):
    name: str
    feature_type: str
    position: int = 0


class ProjectFeatureInstanceCreate(ProjectFeatureInstanceBase):
    pass


class ProjectFeatureInstanceUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None


class ProjectFeatureInstanceResponse(ProjectFeatureInstanceBase):
    id: str
    project_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class FeatureTypeInfo(BaseModel):
    feature_type: str
    label: str
