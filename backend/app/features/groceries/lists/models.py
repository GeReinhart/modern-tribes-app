from datetime import date
from typing import Optional

from pydantic import BaseModel


class GroceriesListCreate(BaseModel):
    feature_instance_id: str
    name: Optional[str] = None
    scheduled_date: date
    assigned_person_id: Optional[str] = None
    force_on_dashboard: bool = False


class GroceriesListResponse(BaseModel):
    id: str
    feature_instance_id: str
    name: Optional[str] = None
    scheduled_date: date
    list_status: str
    assigned_person_id: Optional[str] = None
    force_on_dashboard: bool
    status: str


class GroceriesListItemCreate(BaseModel):
    groceries_item_id: str
    quantity: float


class GroceriesListItemUpdate(BaseModel):
    quantity: Optional[float] = None
    picked_up: Optional[bool] = None


class GroceriesListItemResponse(BaseModel):
    id: str
    groceries_list_id: str
    groceries_item_id: str
    quantity: float
    picked_up: bool
    status: str


class GroceriesListItemDetail(BaseModel):
    id: str
    groceries_item_id: str
    name: str
    unit: str
    quantity: float
    picked_up: bool


class GroceriesListDetailResponse(GroceriesListResponse):
    items: list[GroceriesListItemDetail] = []


class GroceriesSuggestionResponse(BaseModel):
    groceries_item_id: str
    name: str
    unit: str
    renewal_duration_days: int
