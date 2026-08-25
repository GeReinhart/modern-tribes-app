import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.recipes.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/recipes/add_recipe_ingredient.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /recipes/6001/ingredients with a catalog article — the ingredient is added")
def test_add_ingredient_catalog_article():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/ingredients with a custom ingredient not in the catalog — the ingredient is added",
)
def test_add_ingredient_custom():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/ingredients with a fractional quantity for a non-divisible item — "
    "422 error and the recipe is not modified",
)
def test_add_ingredient_fractional_non_divisible():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/ingredients with neither a catalog item nor a custom name — "
    "422 error and the recipe is not modified",
)
def test_add_ingredient_missing_source():
    pass


@scenario(FEATURE, "POST /recipes/6001/ingredients as a project guest — 403 error and the recipe is not modified")
def test_add_ingredient_forbidden():
    pass
