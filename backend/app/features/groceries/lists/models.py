from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, model_validator


class GroceriesListCreate(BaseModel):
    feature_instance_id: str
    name: Optional[str] = None
    scheduled_date: Optional[date] = None
    assigned_person_id: Optional[str] = None
    force_on_dashboard: bool = False
    copy_from_list_id: Optional[str] = None


class GroceriesListUpdate(BaseModel):
    name: Optional[str] = None
    scheduled_date: Optional[date] = None
    status: Optional[Literal["active", "archived"]] = None
    is_favorite: Optional[bool] = None


class GroceriesListResponse(BaseModel):
    id: str
    feature_instance_id: str
    name: Optional[str] = None
    scheduled_date: Optional[date] = None
    list_status: str
    assigned_person_id: Optional[str] = None
    force_on_dashboard: bool
    is_favorite: bool
    status: str
    items_count: int
    picked_up_count: int


class GroceriesListItemCreate(BaseModel):
    groceries_item_id: Optional[str] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    quantity: float

    @model_validator(mode="after")
    def _require_one_source(self) -> "GroceriesListItemCreate":
        if bool(self.groceries_item_id) == bool(self.custom_name and self.custom_name.strip()):
            raise ValueError("Provide either groceries_item_id or a non-empty custom_name, not both.")
        return self


class GroceriesListItemUpdate(BaseModel):
    quantity: Optional[float] = None
    picked_up: Optional[bool] = None
    comment: Optional[str] = None


class GroceriesListItemResponse(BaseModel):
    id: str
    groceries_list_id: str
    groceries_item_id: Optional[str] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    comment: Optional[str] = None
    quantity: float
    picked_up: bool
    status: str


class GroceriesListItemDetail(BaseModel):
    id: str
    groceries_item_id: Optional[str] = None
    name: str
    unit: Optional[str] = None
    icon: Optional[str] = None
    is_divisible: bool = True
    comment: Optional[str] = None
    quantity: float
    picked_up: bool
    section_ids: list[str] = []


class GroceriesListDetailResponse(GroceriesListResponse):
    items: list[GroceriesListItemDetail] = []


class GroceriesSuggestionResponse(BaseModel):
    groceries_item_id: str
    name: str
    unit: str
    icon: Optional[str] = None
    renewal_duration_days: int
    suggested_quantity: Optional[float] = None


class PersonOption(BaseModel):
    id: str
    name: str
