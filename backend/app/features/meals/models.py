from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MealCreate(BaseModel):
    feature_instance_id: str
    title: str
    start_at: datetime
    end_at: datetime
    headcount: int


class MealUpdate(BaseModel):
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    headcount: Optional[int] = None
    status: Optional[str] = None


class MealParticipantInfo(BaseModel):
    person_id: str
    person_name: str


class MealResponse(BaseModel):
    id: str
    feature_instance_id: str
    title: str
    start_at: datetime
    end_at: datetime
    headcount: int
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
    meal_title: str
    meal_start_at: datetime
    recipe_id: str
    recipe_name: str
    headcount: int
    ingredients: list[MealGrocerySuggestionIngredient] = []
