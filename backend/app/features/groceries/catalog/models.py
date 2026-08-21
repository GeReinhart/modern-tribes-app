from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

GroceriesUnit = Literal["gram", "kg", "piece"]
GroceriesItemStatus = Literal["active", "archived"]


class GroceriesItemCreate(BaseModel):
    feature_instance_id: str
    name: str
    description: str = ""
    unit: GroceriesUnit
    icon: Optional[str] = None
    is_divisible: bool = True


class GroceriesItemUpdate(BaseModel):
    feature_instance_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[GroceriesUnit] = None
    icon: Optional[str] = None
    is_divisible: Optional[bool] = None
    status: Optional[GroceriesItemStatus] = None


class GroceriesItemResponse(BaseModel):
    id: str
    name: str
    description: str
    unit: str
    icon: Optional[str] = None
    is_divisible: bool = True
    status: str
    section_ids: list[str] = []
    renewal_duration_days: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class GroceriesItemRenewalUpdate(BaseModel):
    feature_instance_id: str
    renewal_duration_days: Optional[int] = None


class GroceriesSectionCreate(BaseModel):
    feature_instance_id: str
    name: str
    icon: Optional[str] = None


class GroceriesSectionUpdate(BaseModel):
    feature_instance_id: str
    name: Optional[str] = None
    icon: Optional[str] = None


class GroceriesSectionsReorderRequest(BaseModel):
    feature_instance_id: str
    ordered_ids: list[str]


class GroceriesSectionResponse(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
