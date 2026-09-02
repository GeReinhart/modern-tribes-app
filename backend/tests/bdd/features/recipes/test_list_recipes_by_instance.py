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

FEATURE = "../../../features/features/recipes/list_recipes_by_instance.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "GET /recipes/by-instance/0040 with no filters — every active recipe is returned")
def test_list_recipes_no_filters():
    pass


@scenario(FEATURE, "GET /recipes/by-instance/0040 with q matching a recipe's name — only that recipe is returned")
def test_list_recipes_q_matches_name():
    pass


@scenario(
    FEATURE,
    "GET /recipes/by-instance/0040 with q matching only an ingredient's name — the recipe using it is returned",
)
def test_list_recipes_q_matches_ingredient():
    pass


@scenario(
    FEATURE,
    "GET /recipes/by-instance/0040 filtered by ingredient_id — only recipes using that ingredient are returned",
)
def test_list_recipes_filtered_by_ingredient_id():
    pass


@scenario(FEATURE, "GET /recipes/by-instance/0040 with a q matching nothing — an empty list is returned")
def test_list_recipes_q_no_match():
    pass


@scenario(FEATURE, "GET /recipes/by-instance/0040 without project access — 403 error")
def test_list_recipes_forbidden():
    pass
