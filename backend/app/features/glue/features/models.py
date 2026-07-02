from datetime import datetime
from typing import Optional

from pydantic import BaseModel, model_validator


class ProjectFeatureInstanceBase(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    feature_type: str
    position: int = 0
    theme_code: Optional[str] = None


class ProjectFeatureInstanceCreate(ProjectFeatureInstanceBase):
    @model_validator(mode="after")
    def validate_name_or_icon(self):
        """A tab must be identifiable by a name, an icon, or both."""
        if not (self.name and self.name.strip()) and not self.icon:
            raise ValueError("Either name or icon must be provided.")
        return self


class ProjectFeatureInstanceUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None
    theme_code: Optional[str] = None


class ProjectFeatureInstanceResponse(ProjectFeatureInstanceBase):
    id: str
    project_id: str
    status: str
    theme_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class FeatureTypeInfo(BaseModel):
    feature_type: str
    label: str
