import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.recipes.router import router, ingredients_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(ingredients_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/recipes/update_recipe_ingredient.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /recipe-ingredients/6101 with a new quantity — the quantity is updated")
def test_update_ingredient_quantity():
    pass


@scenario(FEATURE, "PATCH /recipe-ingredients/6101 with a display override — the override is set, quantity untouched")
def test_update_ingredient_display_override():
    pass


@scenario(FEATURE, "PATCH /recipe-ingredients/6101 clearing the display override — the recipe shows quantity again")
def test_update_ingredient_clear_display_override():
    pass


@scenario(FEATURE, "PATCH /recipe-ingredients/6101 and 6102 to swap positions — the ingredients are reordered")
def test_update_ingredient_position_swap():
    pass


@scenario(
    FEATURE,
    "PATCH /recipe-ingredients/6103 with a fractional quantity for a non-divisible item — "
    "422 error and the ingredient is not modified",
)
def test_update_ingredient_non_divisible():
    pass


@scenario(FEATURE, "PATCH /recipe-ingredients/6101 as a project guest — 403 error and the ingredient is not modified")
def test_update_ingredient_forbidden():
    pass


@scenario(FEATURE, "PATCH /recipe-ingredients/9999 on a non-existent ingredient — 404 error")
def test_update_ingredient_not_found():
    pass
