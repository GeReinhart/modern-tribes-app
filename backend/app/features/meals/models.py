from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MealCreate(BaseModel):
    feature_instance_id: str
    title: Optional[str] = None
    start_at: datetime
    end_at: datetime
    headcount: int
    document_content_html: Optional[str] = None


class MealUpdate(BaseModel):
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    headcount: Optional[int] = None
    status: Optional[str] = None
    document_content_html: Optional[str] = None


class MealParticipantInfo(BaseModel):
    person_id: str
    person_name: str


class MealResponse(BaseModel):
    id: str
    feature_instance_id: str
    title: Optional[str] = None
    start_at: datetime
    end_at: datetime
    headcount: int
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    status: str
    participant_ids: list[str] = []
    participants: list[MealParticipantInfo] = []
    recipe_ids: list[str] = []


class MealGrocerySuggestionIngredient(BaseModel):
    groceries_item_id: Optional[str] = None
    name: str
    unit: Optional[str] = None
    quantity: float


class MealGrocerySuggestion(BaseModel):
    meal_id: str
    meal_title: Optional[str] = None
    meal_start_at: datetime
    recipe_id: str
    recipe_name: str
    headcount: int
    added: bool = False
    ingredients: list[MealGrocerySuggestionIngredient] = []


class MealAddedToGroceriesList(BaseModel):
    meal_id: str
    meal_title: Optional[str] = None
    meal_start_at: datetime
    headcount: int
    recipe_names: list[str] = []
