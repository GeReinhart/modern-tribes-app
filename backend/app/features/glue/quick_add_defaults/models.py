from typing import Optional

from pydantic import BaseModel


class QuickAddDefaultEntry(BaseModel):
    feature_instance_id: Optional[str] = None


class QuickAddDefaultsResponse(BaseModel):
    task: QuickAddDefaultEntry
    event: QuickAddDefaultEntry


class QuickAddDefaultUpdate(BaseModel):
    feature_instance_id: Optional[str] = None
