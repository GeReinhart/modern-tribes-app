from typing import Literal, Optional

from pydantic import BaseModel, model_validator

RecipeState = Literal["draft", "completed"]


class RecipeCreate(BaseModel):
    feature_instance_id: str
    name: str
    servings: int
    document_content_html: Optional[str] = None


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    servings: Optional[int] = None
    document_content_html: Optional[str] = None
    status: Optional[str] = None
    recipe_state: Optional[RecipeState] = None


class RecipeResponse(BaseModel):
    id: str
    feature_instance_id: str
    name: str
    servings: int
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    status: str
    recipe_state: RecipeState
    label_ids: list[str] = []


class RecipeIngredientCreate(BaseModel):
    groceries_item_id: Optional[str] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    quantity: float
    display_override: Optional[str] = None
    is_accompaniment: bool = False

    @model_validator(mode="after")
    def _require_one_source(self) -> "RecipeIngredientCreate":
        if bool(self.groceries_item_id) == bool(self.custom_name and self.custom_name.strip()):
            raise ValueError("Provide either groceries_item_id or a non-empty custom_name, not both.")
        return self


class RecipeIngredientUpdate(BaseModel):
    quantity: Optional[float] = None
    position: Optional[int] = None
    is_accompaniment: Optional[bool] = None
    display_override: Optional[str] = None


class RecipeIngredientResponse(BaseModel):
    id: str
    recipe_id: str
    groceries_item_id: Optional[str] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    quantity: float
    display_override: Optional[str] = None
    is_accompaniment: bool = False
    status: str


class RecipeIngredientDetail(BaseModel):
    id: str
    groceries_item_id: Optional[str] = None
    name: str
    unit: Optional[str] = None
    is_divisible: bool = True
    quantity: float
    display_override: Optional[str] = None
    position: int
    is_accompaniment: bool = False


class RecipeDetailResponse(RecipeResponse):
    ingredients: list[RecipeIngredientDetail] = []
