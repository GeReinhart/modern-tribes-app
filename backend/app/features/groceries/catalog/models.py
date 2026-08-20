from datetime import datetime
from typing import Literal

from pydantic import BaseModel

GroceriesUnit = Literal["gram", "kg", "piece"]


class GroceriesItemCreate(BaseModel):
    feature_instance_id: str
    name: str
    description: str = ""
    unit: GroceriesUnit


class GroceriesItemResponse(BaseModel):
    id: str
    name: str
    description: str
    unit: str
    status: str
    created_at: datetime
    updated_at: datetime


class GroceriesSectionCreate(BaseModel):
    feature_instance_id: str
    name: str


class GroceriesSectionResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime
    updated_at: datetime
